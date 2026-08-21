from dokuman.utils.logger import logger  # Sistem kayıt aracını ekliyoruz
from dokuman.core.memory import MemoryManager  # Geçmişi hafızada tutacak aracı ekliyoruz
from dokuman.core.llm_client import LMStudioClient  # Yapay zeka bağlantı aracını ekliyoruz
from dokuman.utils.estimator import calculate_optimal_output  # İdeal kelime sayısını hesaplayacak aracı ekliyoruz
from dokuman.prompts.templates import get_system_prompt  # Yapay zeka yönlendirme metinlerini ekliyoruz
from dokuman.core.plan_engine import PlanEngine  # Planlama motorunu ekliyoruz
from dokuman.core.polish_engine import PolishEngine  # Düzenleme motorunu ekliyoruz
class DocumentProcessor:  # Doküman işleme ana sınıfı
    def __init__(self, hardware_profile):  # Başlangıç donanım ayarları
        self.hw_profile = hardware_profile  # Gelen ayarlar sınıfa

        self.llm = LMStudioClient(  # Yapay zeka bağlantısı başlat
            model_name="local-model",
            size_category=self.hw_profile.get("model_size", "medium")  # Donanıma uygun model boyutu seç
        )

        self.plan_engine = PlanEngine(self.llm)  # Planı yapay zekaya bağla
        self.polish_engine = PolishEngine(self.llm, self.hw_profile)  # Düzenlemeye yapay zeka ve donanım bilgisini ver

    def chunk_text(self, text):  # Uzun metinleri parçalara böl
        size = self.hw_profile.get("chunk_size", 800)  # Donanıma göre parça büyüklüğü al
        words = text.split()  # Metni boşluklardan kelimelere ayır
        chunks = [' '.join(words[i:i + size]) for i in range(0, len(words), size)]  # Kelimeleri belirlenen boyutta gruplalistele
        logger.info(f"Metin {len(chunks)} parçaya bölündü.")  # Bölünme işlemini sisteme yazdır
        return chunks  # Parçalanmış metinleri geri dön

    def process_section(self, main_topic, section_name, section_text, detail_level="normal", language="Turkish"):  # Ana bölüm işleme fonksiyonu kur

        estimation = calculate_optimal_output(section_text, detail_level)  # Üretilecek metnin uzunluğunu al
        safe_max_tokens = min(estimation["target_tokens"], self.hw_profile.get("max_tokens", 4096))  #Donanım uygun kelime sınırı

        logger.info("PLAN aşaması başlatılıyor...")

        outline = self.plan_engine.generate_plan(  # Yapay zekaya taslak plan hazırlat
            main_topic,
            section_text,
            language
        )

        logger.info("EXPAND aşaması başlatılıyor...")

        memory = MemoryManager(self.hw_profile.get("window_size", 2))  # Donanıma uygun hafıza yöneticisini başlat
        chunks = self.chunk_text(section_text)  # Gelen metni parçalara böl
        expanded_parts = []  # Genişletilmiş kısımlar için boş liste

        for i, chunk in enumerate(chunks):  # Her bir parça için döngü
            logger.info(f"Expand parça: {i+1}/{len(chunks)}")

            previous_context = "\n".join(memory.history) if memory.history else "Bu ilk bölümdür, önceki içerik yok."  # Hafızadaki eski metinleri al ve birleştir

            system_msg = get_system_prompt(self.hw_profile.get("model_size", "medium"),language)  # Sisteme ve dile uygun yönlendirme

            expand_prompt = f"""
TASK: Write a professional {language} documentation section based on the outline.

MAIN TOPIC: {main_topic}
SECTION: {section_name}

OUTLINE TO FOLLOW:
{outline}

USER'S KEYWORDS / SEED NOTES:
{chunk}

PREVIOUS CONTENT:
{previous_context}

CRITICAL PERMISSION & TRANSLATION:
The "Main Topic", "Section", and "Seed Notes" might be written in any language. You MUST natively translate all concepts, keywords, and titles into {language} while writing. DO NOT leave any mixed language phrases .
The "Seed Notes" above are extremely brief. DO NOT just summarize them!
You have FULL PERMISSION to use your vast internal knowledge.
Bring in historical facts, technical details, and academic theories related to "{section_name}".
HOWEVER, you MUST explicitly connect all these theories back to the specific examples mentioned in the seed notes (e.g., specific animes, characters, or specific technologies). Do not lose the core context.
As long as you stay strictly on this topic, you are FREE to expand the content heavily.

WRITING STYLE & DEPTH:
- Professional {language} academic language.
- {estimation["detail_prompt"]}

OUTPUT FORMAT:
Start immediately with the first ### heading from the outline. 

[START OF DOCUMENT SECTION]
###
"""

            result = self.llm.generate_docs(  # Yapay zekaya metni genişlettir
                system_msg,
                expand_prompt,
                safe_max_tokens
            )

            if result:  # Yapay zekanın verdiği sonucu ekle
                expanded_parts.append(result)  # Gelen sonucu listeye ekle
                memory.add_to_history(result[:1000])  # Sonucun başını hafızaya kaydet
            else:
                logger.warning(f"Expand parça {i+1} başarısız.")

        expanded_document = "\n\n".join(expanded_parts)  # Üretilen tüm parçaları alt alta birleştir

        logger.info("POLISH aşaması başlatılıyor...")

        polished_document = self.polish_engine.refine_document(  # Birleştirilmiş metni son kez düzenletip parlat
            expanded_document,
            language
        )

        return {  # Taslağı ve üretilen metni geri dön
            "section": section_name,
            "estimated_pages": estimation["estimated_pages"],
            "outline": outline,
            "content": polished_document
        }