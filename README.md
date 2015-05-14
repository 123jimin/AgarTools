# AgarTools

Similarly to [this reverse-enginnering project](https://github.com/DnAp/Agar.io-Reverse-Engineering), this project focus on reverse-enginnering the scripts of [agar.io](agar.io) and replacing names with more friendly ones.

However, AgarTools is more focused on extensibility, you can fork this, remake `main_out.js` to keep up with recent updates, change variable names and add some other codes.

## How to use

You can simply replace `agar.io/main_out.js` to `rawgit.com/123jimin/AgarTools/master/main_out_patched.js` by using custom proxies or softwares like Fiddler.

A simple way to replace scripts on Chrome is as following:

1. Install [the Switcherro Redirector](https://chrome.google.com/webstore/detail/switcheroo-redirector/cnmciclhnghalnpfhhleggldniplelbg/).
2. Add the rule redirecting `agar.io/main_out.js` to `rawgit.com/123jimin/AgarTools/master/main_out_patched.js`.
3. It's done! (Refresh the cache if necessary.)
