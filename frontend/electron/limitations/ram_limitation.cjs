const {app} = require('electron')
//BU kısımda uygulamanın kontrolsüz ram kullanılmasının önüne geçmek
//için sadece uygulamayı kapsayan bir ram sınırlaması kullanacak
const ram_limit=4096
function ram_optimization(){
    app.commandLine.appendSwitch('js-flags',`--max-old-space-size=${ram_limit}`);
}
module.exports= {ram_optimization};