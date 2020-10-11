function load_css(file) {
    let link = document.createElement("link");
    link.href = chrome.extension.getURL(file);
    link.id = file;
    link.type = "text/css";
    link.rel = "stylesheet";
    document.getElementsByTagName("head")[0].appendChild(link);
}

function replace_arr(arr) {
    for (i = 0; i < arr.length; ++i) {
        if (!arr[i].hasAttribute("emotified")) {
            for (j = 0; j < window.emotes.length; ++j) {
                let emote = window.emotes[j];
                let expr = ":" + emote.name + ":";
                let str = arr[i].innerHTML;
                arr[i].innerHTML = str.replace(new RegExp(expr, 'ig'),
                       "<span class=\"emote\" data=\"" + expr + "\">"
                       + "<img src=\"" + emote.url + "\""
                       + " alt=\"" + emote.name + "\""
                       + " height=\"" + (str.toLowerCase() === expr.toLowerCase() ? "48" : "22") + "\"></span>");

                // Remove speech bubble for single image
                if (str.toLowerCase() === expr.toLowerCase())
                    arr[i].parentNode.parentNode.style.backgroundColor = "rgba(0, 0, 0, 0)";

                let attr = document.createAttribute("emotified");
                arr[i].setAttributeNode(attr);
            }
        }
    }
}

function replace_emotes() {
    let quoted = document.getElementsByClassName("_4k7e _4ik4 _4ik5");
    let messages = document.getElementsByClassName("_3oh- _58nk");

    if (messages.length > 0) {
        replace_arr(quoted);
        replace_arr(messages);
    } else {
        // Try again
        setTimeout(replace_emotes, 500);
    }
}

function set_incoming_observer(obs) {
    // "_2k8v" is above the main message list
    // Try setting observer every 100ms on "_2k8v" until successful

    let sibling = document.getElementsByClassName("_2k8v")[0];
    if (sibling != null) {
        obs.observe(sibling.nextSibling, {
            childList: true,
            subtree: true
        });
    } else {
        // Try again
        setTimeout(function() {
            set_incoming_observer(obs);
        }, 100);
    }
}

// Not necessarily the conversation, it can also
// be triggered by scrolling
function conversation_changed() {
    let act = document.getElementsByClassName("_1ht2")[0];
    window.conversation_switch_observer.observe(act, {
        attributes: true,
        attributeFilter: ["class"]
    });

    // Set observer to new "_2k8v" sibling
    set_incoming_observer(window.incoming_observer);
}

/****************** MAIN ******************/
function plugin_main() {
    console.log("Loading Custom Messenger Emotes plugin...");

    // Proves existence
    if (document.getElementsByClassName("_6-xl _6-xm").length > 0) {
        let json_url = chrome.runtime.getURL('emotes.json');
        fetch(json_url)
            .then((response) => response.json())
            .then((json) => { window.emotes = json.emotes; });

        load_css('styles.css');

        //MutationObserver for switching conversations
        window.conversation_switch_observer = new MutationObserver(function() {
            replace_emotes();
            conversation_changed();
        });

        // Replace emotes on mutation after 100ms
        window.incoming_observer = new MutationObserver(function() {
            replace_emotes();
        });

        conversation_changed();

        console.log("Custom Messenger Emotes plugin loaded!");
    } else {
        setTimeout(plugin_main, 1000);
    }
}

// facebook.com/messenger loads twice
if (window.location.host !== "www.facebook.com" || parent.frames.length > 0)
    plugin_main();
