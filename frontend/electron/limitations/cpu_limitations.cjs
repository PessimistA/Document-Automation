const {app} = require('electron')
//BU kısımda uygulamanın kontrolsüz cpu kullanılmasının önüne geçmek
//için sadece uygulamayı kapsayan bir cpu sınırlaması kullanacak
function cpu_optimization(){
    app.commandLine.appendSwitch('disable-background-timer-throttling');
}
module.exports= {cpu_optimization};
