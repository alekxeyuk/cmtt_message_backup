var _loadScript = path => {
    let script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = path;
    document.head.appendChild(script);
};
_loadScript('https://stuk.github.io/jszip/dist/jszip.js');
_loadScript('https://stuk.github.io/jszip/vendor/FileSaver.js');

var page = 1;
var users = [];
while (page) {
    r = await fetch(`https://dtf.ru/m/channels?page=${page}`, {
        "headers": {
        "x-this-is-csrf": "THIS IS SPARTA!",
    },
    "referrerPolicy": "origin",
    "body": null,
    "method": "GET",
    "mode": "cors"
    });
    let js = await r.json();
    console.log(js.data.channels);
    if (js.data.channels.length) {
        page++;
        users.push(...js.data.channels)
    } else {
        break;
    }
}

const url_regex = /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi;
var zip = new JSZip();
for (let user of users) {
    let user_folder = zip.folder(user.title);
    let user_messages = [];
    let text_messages = [];
    let beforeTime = 0;
    while (true) {
        r = await fetch(`https://dtf.ru/m/messages?channelId=${user.id}&beforeTime=${beforeTime}`, {
            "headers": {
            "x-this-is-csrf": "THIS IS SPARTA!",
        },
        "referrerPolicy": "origin",
        "body": null,
        "method": "GET",
        "mode": "cors"
        });
        let js = await r.json();
        if (js.data.messages.length) {
            user_messages.push(...js.data.messages);
            beforeTime = js.data.messages[0].dtCreated;
        } else {
            break;
        }
    }
    user_messages.sort((a, b) => {return a.dtCreated > b.dtCreated ? 1 : -1});
    
    let last_author_id = "0";
    user_messages.forEach((message, index) => {
        let new_author = last_author_id !== message.author.id
        //FIRST LEVEL
        let message_div = document.createElement('div');
        message_div.setAttribute('class', 'message');
        if (new_author) {
            last_author_id = message.author.id;
            message_div.innerHTML = `<img data-src="${message.author.picture}scale_crop/72x72/center" class="lazy message__picture">`;
        } else {
            message_div.classList.add('message--same-author');
        }
        //message__content LEVEL
        let message_content_div = document.createElement('div');
        message_content_div.setAttribute('class', 'message__content');
        if (new_author) {
            message_content_div.innerHTML = `<div class="message__content-name">${message.author.title}</div>`;
        }
        if (message.replyTo) {
            let reply_div = document.createElement('div');
            reply_div.setAttribute('class', 'message__content-reply');
            reply_div.innerHTML = `<div class="message__content-reply-name">${message.replyTo.author.title}</div><div class="message__content-reply-text">${message.replyTo.text}</div>`
            message_content_div.appendChild(reply_div);
        }
        if (message.text) {
            let content_text_div = document.createElement('div');
            let text_copy = message.text.slice(0);
            content_text_div.setAttribute('class', 'message__content-text');
            [...message.text.matchAll(url_regex)].forEach(match => {
                let matched_url = match[0].trim();
                text_copy = text_copy.replace(matched_url, `<a href="${matched_url}" class="linkified" target="_blank" rel="nofollow noreferrer noindex noopener">${matched_url}</a>`);
            })
            content_text_div.innerHTML = text_copy;
            message_content_div.appendChild(content_text_div);
        }
        if (message.media) {
            let media_div = document.createElement('div');
            media_div.setAttribute('class', 'message-attaches message__content-media');
            if (message.media[0].type === "image" && message.media[0].data.type !== "gif") {
                media_div.innerHTML = `<div class="message-attaches__item"><img data-src="https://leonardo.osnova.io/${message.media[0].data.uuid}/-/resize/1000" class="lazy message-attaches__item-image" style="max-width: 300px; max-height: 300px;"></div>`;
            } else {
                media_div.innerHTML = `<div class="message-attaches__item"><video autoplay="autoplay" loop="loop" muted="muted" playsinline="" class="lazy message-attaches__item-video" style="max-width: 300px; max-height: 300px;" data-src="https://leonardo.osnova.io/${message.media[0].data.uuid}/-/format/mp4/"><source data-src="https://leonardo.osnova.io/${message.media[0].data.uuid}/-/format/mp4/" type="video/mp4"></video></div>`;
            }
            message_content_div.appendChild(media_div);
        }
        message_div.appendChild(message_content_div);
        let time_right = document.createElement('div');
        time_right.setAttribute('class', 'message__right');
        let myDate = new Date(message.dtCreated * 1000);
        time_right.innerHTML = `<time title="${myDate.toLocaleString()}" class="message__time">${myDate.toLocaleString()}</time><div class="message__actions"></div>`;
        message_div.appendChild(time_right);
        
        text_messages.push(message_div.outerHTML);
    });
    user_folder.file(`${user.id}.html`, `
<!DOCTYPE html>
<html>
    <head>
        <link rel="stylesheet" href="https://dtfstaticbf19cf1-a.akamaihd.net/static/build/dtf.ru/all.c629faf6.min.css">
        <script>
            var xhttp = new XMLHttpRequest();
            xhttp.open("GET", "https://gist.githubusercontent.com/alekxeyuk/d0df7e51ca69cd0494f53a89dba5277e/raw/15dbe81c9ca5aeac061b61ac691805aa2516528f/messages_backup.css", true);
            xhttp.onreadystatechange = function() {
                if (xhttp.readyState === 4) {
                    if (xhttp.status === 200) {
                        let link = document.createElement('style');
                        link.innerHTML = xhttp.responseText;
                        document.getElementsByTagName('head')[0].appendChild(link);
                }
              }
            }
            xhttp.send(null);
        </script>
        <script src="https://cdn.jsdelivr.net/npm/vanilla-lazyload@17.1.2/dist/lazyload.min.js"></script>
    </head>
    <body class="app app--content-full app--left-column-on app--right-column-off app--propaganda-off app--entry-width-slim app--entry-priority-live app--live-auto app--ad-blocked">
        <div class="chat-messages">
            <div class="chat-messages__list" style="">
                ${text_messages.join("\n")}
            </div>
        </div>
    </body>
    <script>
    var lazyLoadInstance = new LazyLoad({
        // Your custom settings go here
    });
    </script>
</html>`);
}
zip.generateAsync({type:"blob"}).then(content => {
    saveAs(content, "example.zip");
});
