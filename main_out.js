(function(window, $) {
    function onLoad() {
        getServerInfo();
        setInterval(getServerInfo, 18e4);
        mainCanv = mainCanvDup = document.getElementById("canvas");
        mainCtx = mainCanv.getContext("2d");
        mainCanv.onmousedown = function(evt) {
            if (isMobile) {
                var unk_5 = evt.clientX - (5 + winWidth / 5 / 2), unk_6 = evt.clientY - (5 + winWidth / 5 / 2);
                if (Math.sqrt(unk_5 * unk_5 + unk_6 * unk_6) <= winWidth / 5 / 2) {
                    wsSendCursor();
                    wsSendData(17);
                    return;
                }
            }
            targetX = evt.clientX;
            targetY = evt.clientY;
            unk_21();
            wsSendCursor();
        };
        mainCanv.onmousemove = function(evt) {
            targetX = evt.clientX;
            targetY = evt.clientY;
            unk_21();
        };
        mainCanv.onmouseup = function(evt) {};
        var keyflag_space = !1, keyflag_Q = !1, keyflag_W = !1;
        window.onkeydown = function(evt) {
            32 != evt.keyCode || keyflag_space || (wsSendCursor(), wsSendData(17), keyflag_space = !0);
            81 != evt.keyCode || keyflag_Q || (wsSendData(18), keyflag_Q = !0);
            87 != evt.keyCode || keyflag_W || (wsSendCursor(), wsSendData(21), keyflag_W = !0);
            27 == evt.keyCode && $("#overlays").fadeIn(200);
        };
        window.onkeyup = function(evt) {
            32 == evt.keyCode && (keyflag_space = !1);
            87 == evt.keyCode && (keyflag_W = !1);
            81 == evt.keyCode && keyflag_Q && (wsSendData(19), keyflag_Q = !1);
        };
        window.onblur = function() {
            wsSendData(19);
            keyflag_W = keyflag_Q = keyflag_space = !1;
        };
        window.onresize = onResize;
        onResize();
        window.requestAnimationFrame ? window.requestAnimationFrame(onAnimationFrame) : setInterval(redraw, 1e3 / 60);
        setInterval(wsSendCursor, 40);
        joinRegion($("#region").val());
        $("#overlays").show();
    }
    function unk_14() {
        if (.5 > zoomFactor) unk_112 = null; else {
            for (var minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY, unk_19 = 0, unk_20 = 0; unk_20 < unk_119.length; unk_20++) unk_119[unk_20].shouldRender() && (unk_19 = Math.max(unk_119[unk_20].size, unk_19), 
            minX = Math.min(unk_119[unk_20].x, minX), minY = Math.min(unk_119[unk_20].y, minY), 
            maxX = Math.max(unk_119[unk_20].x, maxX), maxY = Math.max(unk_119[unk_20].y, maxY));
            unk_112 = QUAD.init({
                minX: minX - (unk_19 + 100),
                minY: minY - (unk_19 + 100),
                maxX: maxX + (unk_19 + 100),
                maxY: maxY + (unk_19 + 100)
            });
            for (unk_20 = 0; unk_20 < unk_119.length; unk_20++) if (minX = unk_119[unk_20], 
            minX.shouldRender()) for (minY = 0; minY < minX.points.length; ++minY) unk_112.insert(minX.points[minY]);
        }
    }
    function unk_21() {
        unk_124 = (targetX - winWidth / 2) / zoomFactor + viewCenter_x;
        unk_125 = (targetY - winHeight / 2) / zoomFactor + viewCenter_y;
    }
    function getServerInfo() {
        null == unk_150 && (unk_150 = {}, $("#region").children().each(function() {
            var unk_23 = $(this), unk_24 = unk_23.val();
            unk_24 && (unk_150[unk_24] = unk_23.text());
        }));
        $.get("http://m.agar.io/info", function(regionData) {
            var unk_26 = {}, unk_27;
            for (unk_27 in regionData.regions) {
                var unk_28 = unk_27.split(":")[0];
                unk_26[unk_28] = unk_26[unk_28] || 0;
                unk_26[unk_28] += regionData.regions[unk_27].numPlayers;
            }
            for (unk_27 in unk_26) $('#region option[value="' + unk_27 + '"]').text(unk_150[unk_27] + " (" + unk_26[unk_27] + " players)");
        }, "json");
    }
    function hideOverlay() {
        $("#adsBottom").hide();
        $("#overlays").hide();
    }
    function joinRegion(region) {
        region && region != unk_134 && (unk_134 = region, beginConnectServer());
    }
    function tryConnectServer() {
        console.log("Find " + unk_134 + unk_145);
        $.ajax("http://m.agar.io/", {
            error: function() {
                setTimeout(tryConnectServer, 1e3);
            },
            success: function(addr) {
                addr = addr.split("\n");
                openSocket("ws://" + addr[0]);
            },
            dataType: "text",
            method: "POST",
            cache: !1,
            crossDomain: !0,
            data: unk_134 + unk_145 || "?"
        });
    }
    function beginConnectServer() {
        unk_134 && ($("#connecting").show(), tryConnectServer());
    }
    function openSocket(socket_addr) {
        ws && (ws.onopen = null, ws.onmessage = null, ws.onclose = null, ws.close(), ws = null);
        unk_116 = [];
        myBlobs = [];
        unk_118 = {};
        unk_119 = [];
        unk_120 = [];
        leaderboards = [];
        lBoardCanv = unk_146 = null;
        console.log("Connecting to " + socket_addr);
        ws = new WebSocket(socket_addr);
        ws.binaryType = "arraybuffer";
        ws.onopen = wsOnOpen;
        ws.onmessage = wsOnMessage;
        ws.onclose = wsOnClose;
        ws.onerror = function() {
            console.log("socket error");
        };
    }
    function wsOnOpen(msg) {
        $("#connecting").hide();
        console.log("socket open");
        msg = new ArrayBuffer(5);
        var view = new DataView(msg);
        view.setUint8(0, 254);
        view.setUint32(1, 1, !0);
        ws.send(msg);
        msg = new ArrayBuffer(5);
        view = new DataView(msg);
        view.setUint8(0, 255);
        view.setUint32(1, 1, !0);
        ws.send(msg);
        wsSendNick();
    }
    function wsOnClose(msg) {
        console.log("socket close");
        setTimeout(beginConnectServer, 500);
    }
    function wsOnMessage(unk_43) {
        function unk_44() {
            for (var unk_45 = ""; ;) {
                var unk_46 = unk_48.getUint16(unk_47, !0);
                unk_47 += 2;
                if (0 == unk_46) break;
                unk_45 += String.fromCharCode(unk_46);
            }
            return unk_45;
        }
        var unk_47 = 1, unk_48 = new DataView(unk_43.data);
        switch (unk_48.getUint8(0)) {
          case 16:
            unk_51(unk_48);
            break;

          case 17:
            unk_142 = unk_48.getFloat32(1, !0);
            unk_143 = unk_48.getFloat32(5, !0);
            unk_144 = unk_48.getFloat32(9, !0);
            break;

          case 20:
            myBlobs = [];
            unk_116 = [];
            break;

          case 32:
            unk_116.push(unk_48.getUint32(1, !0));
            break;

          case 49:
            if (null != unk_146) break;
            unk_43 = unk_48.getUint32(unk_47, !0);
            unk_47 += 4;
            leaderboards = [];
            for (var unk_49 = 0; unk_49 < unk_43; ++unk_49) {
                var unk_50 = unk_48.getUint32(unk_47, !0), unk_47 = unk_47 + 4;
                leaderboards.push({
                    id: unk_50,
                    name: unk_44()
                });
            }
            unk_90();
            break;

          case 50:
            unk_146 = [];
            unk_43 = unk_48.getUint32(unk_47, !0);
            unk_47 += 4;
            for (unk_49 = 0; unk_49 < unk_43; ++unk_49) unk_146.push(unk_48.getFloat32(unk_47, !0)), 
            unk_47 += 4;
            unk_90();
            break;

          case 64:
            unk_129 = unk_48.getFloat64(1, !0), unk_130 = unk_48.getFloat64(9, !0), unk_131 = unk_48.getFloat64(17, !0), 
            unk_132 = unk_48.getFloat64(25, !0), unk_142 = (unk_131 + unk_129) / 2, unk_143 = (unk_132 + unk_130) / 2, 
            unk_144 = 1, 0 == myBlobs.length && (viewCenter_x = unk_142, viewCenter_y = unk_143, 
            zoomFactor = unk_144);
        }
    }
    function unk_51(unk_52) {
        unk_127 = +new Date();
        var unk_53 = Math.random(), unk_54 = 1;
        unk_138 = !1;
        for (var unk_55 = unk_52.getUint16(unk_54, !0), unk_54 = unk_54 + 2, unk_56 = 0; unk_56 < unk_55; ++unk_56) {
            var unk_57 = unk_118[unk_52.getUint32(unk_54, !0)], unk_58 = unk_118[unk_52.getUint32(unk_54 + 4, !0)], unk_54 = unk_54 + 8;
            unk_57 && unk_58 && (unk_58.destroy(), unk_58.ox = unk_58.x, unk_58.oy = unk_58.y, 
            unk_58.oSize = unk_58.size, unk_58.nx = unk_57.x, unk_58.ny = unk_57.y, unk_58.nSize = unk_58.size, 
            unk_58.updateTime = unk_127);
        }
        for (;;) {
            unk_55 = unk_52.getUint32(unk_54, !0);
            unk_54 += 4;
            if (0 == unk_55) break;
            for (var unk_56 = unk_52.getFloat32(unk_54, !0), unk_54 = unk_54 + 4, unk_57 = unk_52.getFloat32(unk_54, !0), unk_54 = unk_54 + 4, unk_58 = unk_52.getFloat32(unk_54, !0), unk_54 = unk_54 + 4, unk_59 = unk_52.getUint8(unk_54++), unk_60 = unk_52.getUint8(unk_54++), unk_61 = unk_52.getUint8(unk_54++), unk_59 = (unk_59 << 16 | unk_60 << 8 | unk_61).toString(16); 6 > unk_59.length; ) unk_59 = "0" + unk_59;
            unk_59 = "#" + unk_59;
            unk_61 = unk_52.getUint8(unk_54++);
            unk_60 = !!(unk_61 & 1);
            unk_61 & 2 && (unk_54 += 4);
            unk_61 & 4 && (unk_54 += 8);
            unk_61 & 8 && (unk_54 += 16);
            for (unk_61 = ""; ;) {
                var unk_62 = unk_52.getUint16(unk_54, !0), unk_54 = unk_54 + 2;
                if (0 == unk_62) break;
                unk_61 += String.fromCharCode(unk_62);
            }
            unk_62 = null;
            unk_118.hasOwnProperty(unk_55) ? (unk_62 = unk_118[unk_55], unk_62.updatePos(), 
            unk_62.ox = unk_62.x, unk_62.oy = unk_62.y, unk_62.oSize = unk_62.size, unk_62.color = unk_59) : (unk_62 = new Cell(unk_55, unk_56, unk_57, unk_58, unk_59, unk_60, unk_61), 
            unk_62.pX = unk_56, unk_62.pY = unk_57);
            unk_62.nx = unk_56;
            unk_62.ny = unk_57;
            unk_62.nSize = unk_58;
            unk_62.updateCode = unk_53;
            unk_62.updateTime = unk_127;
            -1 != unk_116.indexOf(unk_55) && -1 == myBlobs.indexOf(unk_62) && (document.getElementById("overlays").style.display = "none", 
            myBlobs.push(unk_62), 1 == myBlobs.length && (viewCenter_x = unk_62.x, viewCenter_y = unk_62.y));
        }
        unk_52.getUint16(unk_54, !0);
        unk_54 += 2;
        unk_57 = unk_52.getUint32(unk_54, !0);
        unk_54 += 4;
        for (unk_56 = 0; unk_56 < unk_57; unk_56++) unk_55 = unk_52.getUint32(unk_54, !0), 
        unk_54 += 4, unk_118[unk_55] && (unk_118[unk_55].updateCode = unk_53);
        for (unk_56 = 0; unk_56 < unk_119.length; unk_56++) unk_119[unk_56].updateCode != unk_53 && unk_119[unk_56--].destroy();
        unk_138 && 0 == myBlobs.length && $("#overlays").fadeIn(3e3);
    }
    function wsSendCursor() {
        if (null != ws && ws.readyState == ws.OPEN) {
            var dx = targetX - winWidth / 2, dy = targetY - winHeight / 2;
            64 > dx * dx + dy * dy || unk_158 == unk_124 && unk_159 == unk_125 || (unk_158 = unk_124, 
            unk_159 = unk_125, dx = new ArrayBuffer(21), dy = new DataView(dx), dy.setUint8(0, 16), 
            dy.setFloat64(1, unk_124, !0), dy.setFloat64(9, unk_125, !0), dy.setUint32(17, 0, !0), 
            ws.send(dx));
        }
    }
    function wsSendNick() {
        if (null != ws && ws.readyState == ws.OPEN && null != unk_128) {
            var bufffer = new ArrayBuffer(1 + 2 * unk_128.length), view = new DataView(bufffer);
            view.setUint8(0, 0);
            for (var i = 0; i < unk_128.length; ++i) view.setUint16(1 + 2 * i, unk_128.charCodeAt(i), !0);
            ws.send(bufffer);
        }
    }
    function wsSendData(data) {
        if (null != ws && ws.readyState == ws.OPEN) {
            var buffer = new ArrayBuffer(1);
            new DataView(buffer).setUint8(0, data);
            ws.send(buffer);
        }
    }
    function onAnimationFrame() {
        redraw();
        window.requestAnimationFrame(onAnimationFrame);
    }
    function onResize() {
        winWidth = window.innerWidth;
        winHeight = window.innerHeight;
        mainCanvDup.width = mainCanv.width = winWidth;
        mainCanvDup.height = mainCanv.height = winHeight;
        redraw();
    }
    function unk_75() {
        if (0 != myBlobs.length) {
            for (var unk_76 = 0, unk_77 = 0; unk_77 < myBlobs.length; unk_77++) unk_76 += myBlobs[unk_77].size;
            unk_76 = Math.pow(Math.min(64 / unk_76, 1), .4) * Math.max(winHeight / 1080, winWidth / 1920);
            zoomFactor = (9 * zoomFactor + unk_76) / 10;
        }
    }
    function redraw() {
        var unk_79 = +new Date();
        ++unk_126;
        unk_127 = +new Date();
        if (0 < myBlobs.length) {
            unk_75();
            for (var unk_80 = 0, unk_81 = 0, unk_82 = 0; unk_82 < myBlobs.length; unk_82++) myBlobs[unk_82].updatePos(), 
            unk_80 += myBlobs[unk_82].x / myBlobs.length, unk_81 += myBlobs[unk_82].y / myBlobs.length;
            unk_142 = unk_80;
            unk_143 = unk_81;
            unk_144 = zoomFactor;
            viewCenter_x = (viewCenter_x + unk_80) / 2;
            viewCenter_y = (viewCenter_y + unk_81) / 2;
        } else viewCenter_x = (29 * viewCenter_x + unk_142) / 30, viewCenter_y = (29 * viewCenter_y + unk_143) / 30, 
        zoomFactor = (9 * zoomFactor + unk_144) / 10;
        unk_14();
        unk_21();
        mainCtx.clearRect(0, 0, winWidth, winHeight);
        mainCtx.fillStyle = darkTheme ? "#111111" : "#F2FBFF";
        mainCtx.fillRect(0, 0, winWidth, winHeight);
        mainCtx.save();
        mainCtx.strokeStyle = darkTheme ? "#AAAAAA" : "#000000";
        mainCtx.globalAlpha = .2;
        mainCtx.scale(zoomFactor, zoomFactor);
        unk_80 = winWidth / zoomFactor;
        unk_81 = winHeight / zoomFactor;
        for (unk_82 = -.5 + (-viewCenter_x + unk_80 / 2) % 50; unk_82 < unk_80; unk_82 += 50) mainCtx.beginPath(), 
        mainCtx.moveTo(unk_82, 0), mainCtx.lineTo(unk_82, unk_81), mainCtx.stroke();
        for (unk_82 = -.5 + (-viewCenter_y + unk_81 / 2) % 50; unk_82 < unk_81; unk_82 += 50) mainCtx.beginPath(), 
        mainCtx.moveTo(0, unk_82), mainCtx.lineTo(unk_80, unk_82), mainCtx.stroke();
        mainCtx.restore();
        unk_119.sort(function(unk_83, unk_84) {
            return unk_83.size == unk_84.size ? unk_83.id - unk_84.id : unk_83.size - unk_84.size;
        });
        mainCtx.save();
        mainCtx.translate(winWidth / 2, winHeight / 2);
        mainCtx.scale(zoomFactor, zoomFactor);
        mainCtx.translate(-viewCenter_x, -viewCenter_y);
        for (unk_82 = 0; unk_82 < unk_120.length; unk_82++) unk_120[unk_82].draw();
        for (unk_82 = 0; unk_82 < unk_119.length; unk_82++) unk_119[unk_82].draw();
        mainCtx.restore();
        lBoardCanv && mainCtx.drawImage(lBoardCanv, winWidth - lBoardCanv.width - 10, 10);
        unk_139 = Math.max(unk_139, unk_87());
        0 != unk_139 && (null == unk_162 && (unk_162 = new TextDisplayer(24, "#FFFFFF")), 
        unk_162.setValue("Score: " + ~~(unk_139 / 100)), unk_81 = unk_162.render(), unk_80 = unk_81.width, 
        mainCtx.globalAlpha = .2, mainCtx.fillStyle = "#000000", mainCtx.fillRect(10, winHeight - 10 - 24 - 10, unk_80 + 10, 34), 
        mainCtx.globalAlpha = 1, mainCtx.drawImage(unk_81, 15, winHeight - 10 - 24 - 5));
        unk_85();
        unk_79 = +new Date() - unk_79;
        unk_79 > 1e3 / 60 ? unk_161 -= .01 : unk_79 < 1e3 / 65 && (unk_161 += .01);
        .4 > unk_161 && (unk_161 = .4);
        1 < unk_161 && (unk_161 = 1);
    }
    function unk_85() {
        if (isMobile && unk_149.width) {
            var unk_86 = winWidth / 5;
            mainCtx.drawImage(unk_149, 5, 5, unk_86, unk_86);
        }
    }
    function unk_87() {
        for (var unk_88 = 0, unk_89 = 0; unk_89 < myBlobs.length; unk_89++) unk_88 += myBlobs[unk_89].nSize * myBlobs[unk_89].nSize;
        return unk_88;
    }
    function unk_90() {
        lBoardCanv = null;
        if (null != unk_146 || 0 != leaderboards.length) if (null != unk_146 || showNames) {
            lBoardCanv = document.createElement("canvas");
            var lBoardCtx = lBoardCanv.getContext("2d"), unk_92 = 60, unk_92 = null == unk_146 ? unk_92 + 24 * leaderboards.length : unk_92 + 180, str = Math.min(200, .3 * winWidth) / 200;
            lBoardCanv.width = 200 * str;
            lBoardCanv.height = unk_92 * str;
            lBoardCtx.scale(str, str);
            lBoardCtx.globalAlpha = .4;
            lBoardCtx.fillStyle = "#000000";
            lBoardCtx.fillRect(0, 0, 200, unk_92);
            lBoardCtx.globalAlpha = 1;
            lBoardCtx.fillStyle = "#FFFFFF";
            str = null;
            str = "Leaderboard";
            lBoardCtx.font = "30px Ubuntu";
            lBoardCtx.fillText(str, 100 - lBoardCtx.measureText(str).width / 2, 40);
            if (null == unk_146) for (lBoardCtx.font = "20px Ubuntu", unk_92 = 0; unk_92 < leaderboards.length; ++unk_92) str = leaderboards[unk_92].name || "An unnamed cell", 
            showNames || (str = "An unnamed cell"), -1 != unk_116.indexOf(leaderboards[unk_92].id) ? (myBlobs[0].name && (str = myBlobs[0].name), 
            lBoardCtx.fillStyle = "#FFAAAA") : lBoardCtx.fillStyle = "#FFFFFF", str = unk_92 + 1 + ". " + str, 
            lBoardCtx.fillText(str, 100 - lBoardCtx.measureText(str).width / 2, 70 + 24 * unk_92); else for (unk_92 = str = 0; unk_92 < unk_146.length; ++unk_92) angEnd = str + unk_146[unk_92] * Math.PI * 2, 
            lBoardCtx.fillStyle = unk_147[unk_92 + 1], lBoardCtx.beginPath(), lBoardCtx.moveTo(100, 140), 
            lBoardCtx.arc(100, 140, 80, str, angEnd, !1), lBoardCtx.fill(), str = angEnd;
        }
    }
    function Cell(id, x, y, size, color, isVirus, name) {
        unk_119.push(this);
        unk_118[id] = this;
        this.id = id;
        this.ox = this.x = x;
        this.oy = this.y = y;
        this.oSize = this.size = size;
        this.color = color;
        this.isVirus = isVirus;
        this.points = [];
        this.pointsAcc = [];
        this.createPoints();
        this.setName(name);
    }
    function TextDisplayer(size, color, stroke, strokeColor) {
        size && (this._size = size);
        color && (this._color = color);
        this._stroke = !!stroke;
        strokeColor && (this._strokeColor = strokeColor);
    }
    if ("agar.io" != window.location.hostname && "localhost" != window.location.hostname && "10.10.2.13" != window.location.hostname) window.location = "http://agar.io/"; else if (window.top != window) window.top.location = "http://agar.io/"; else {
        var mainCanvDup, mainCtx, mainCanv, winWidth, winHeight, unk_112 = null, ws = null, viewCenter_x = 0, viewCenter_y = 0, unk_116 = [], myBlobs = [], unk_118 = {}, unk_119 = [], unk_120 = [], leaderboards = [], targetX = 0, targetY = 0, unk_124 = -1, unk_125 = -1, unk_126 = 0, unk_127 = 0, unk_128 = null, unk_129 = 0, unk_130 = 0, unk_131 = 1e4, unk_132 = 1e4, zoomFactor = 1, unk_134 = null, showSkins = !0, showNames = !0, noColor = !1, unk_138 = !1, unk_139 = 0, darkTheme = !1, showMass = !1, unk_142 = viewCenter_x = ~~((unk_129 + unk_131) / 2), unk_143 = viewCenter_y = ~~((unk_130 + unk_132) / 2), unk_144 = 1, unk_145 = "", unk_146 = null, unk_147 = [ "#333333", "#FF3333", "#33FF33", "#3333FF" ], isMobile = "ontouchstart" in window && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent), unk_149 = new Image();
        unk_149.src = "img/split.png";
        var unk_150 = null;
        window.setNick = function(_nick) {
            hideOverlay();
            unk_128 = _nick;
            wsSendNick();
            unk_139 = 0;
        };
        window.setRegion = joinRegion;
        window.setSkins = function(_skin) {
            showSkins = _skin;
        };
        window.setNames = function(_name) {
            showNames = _name;
        };
        window.setDarkTheme = function(_darkTheme) {
            darkTheme = _darkTheme;
        };
        window.setColors = function(_color) {
            noColor = _color;
        };
        window.setShowMass = function(_showMass) {
            showMass = _showMass;
        };
        window.spectate = function() {
            wsSendData(1);
            hideOverlay();
        };
        window.setGameMode = function(_gameMode) {
            _gameMode != unk_145 && (unk_145 = _gameMode, beginConnectServer());
        };
        window.connect = openSocket;
        var unk_158 = -1, unk_159 = -1, lBoardCanv = null, unk_161 = 1, unk_162 = null, skinImages = {}, skinList = "poland;usa;china;russia;canada;australia;spain;brazil;germany;ukraine;france;sweden;hitler;north korea;south korea;japan;united kingdom;earth;greece;latvia;lithuania;estonia;finland;norway;cia;maldivas;austria;nigeria;reddit;yaranaika;confederate;9gag;indiana;4chan;italy;ussr;bulgaria;tumblr;2ch.hk;hong kong;portugal;jamaica;german empire;mexico;sanik;switzerland;croatia;chile;indonesia;bangladesh;thailand;iran;iraq;peru;moon;botswana;bosnia;netherlands;european union;taiwan;pakistan;hungary;satanist;qing dynasty;nazi;matriarchy;patriarchy;feminism;ireland;texas;facepunch;prodota;cambodia;steam;piccolo;ea;india;kc;denmark;quebec;ayy lmao;sealand;bait;tsarist russia;origin;vinesauce;stalin;belgium;luxembourg;stussy;prussia;8ch;argentina;scotland;sir;romania;belarus;wojak;isis;doge;nasa;byzantium;imperial japan;french kingdom;somalia;turkey;mars;pokerface".split(";"), unk_165 = [ "m'blob" ];
        Cell.prototype = {
            id: 0,
            points: null,
            pointsAcc: null,
            name: null,
            nameCache: null,
            sizeCache: null,
            x: 0,
            y: 0,
            size: 0,
            ox: 0,
            oy: 0,
            oSize: 0,
            nx: 0,
            ny: 0,
            nSize: 0,
            updateTime: 0,
            updateCode: 0,
            drawTime: 0,
            destroyed: !1,
            isVirus: !1,
            destroy: function() {
                var unk_166;
                for (unk_166 = 0; unk_166 < unk_119.length; unk_166++) if (unk_119[unk_166] == this) {
                    unk_119.splice(unk_166, 1);
                    break;
                }
                delete unk_118[this.id];
                unk_166 = myBlobs.indexOf(this);
                -1 != unk_166 && (unk_138 = !0, myBlobs.splice(unk_166, 1));
                unk_166 = unk_116.indexOf(this.id);
                -1 != unk_166 && unk_116.splice(unk_166, 1);
                this.destroyed = !0;
                unk_120.push(this);
            },
            getNameSize: function() {
                return Math.max(~~(.3 * this.size), 24);
            },
            setName: function(name) {
                if (this.name = name) null == this.nameCache ? this.nameCache = new TextDisplayer(this.getNameSize(), "#FFFFFF", !0, "#000000") : this.nameCache.setSize(this.getNameSize()), 
                this.nameCache.setValue(this.name);
            },
            createPoints: function() {
                for (var numPoints = this.getNumPoints(); this.points.length > numPoints; ) {
                    var unk_169 = ~~(Math.random() * this.points.length);
                    this.points.splice(unk_169, 1);
                    this.pointsAcc.splice(unk_169, 1);
                }
                0 == this.points.length && 0 < numPoints && (this.points.push({
                    c: this,
                    v: this.size,
                    x: this.x,
                    y: this.y
                }), this.pointsAcc.push(Math.random() - .5));
                for (;this.points.length < numPoints; ) {
                    var unk_169 = ~~(Math.random() * this.points.length), unk_170 = this.points[unk_169];
                    this.points.splice(unk_169, 0, {
                        c: this,
                        v: unk_170.v,
                        x: unk_170.x,
                        y: unk_170.y
                    });
                    this.pointsAcc.splice(unk_169, 0, this.pointsAcc[unk_169]);
                }
            },
            getNumPoints: function() {
                var minPoints = 10;
                20 > this.size && (minPoints = 5);
                this.isVirus && (minPoints = 30);
                return ~~Math.max(this.size * zoomFactor * (this.isVirus ? Math.min(2 * unk_161, 1) : unk_161), minPoints);
            },
            movePoints: function() {
                this.createPoints();
                for (var points = this.points, orig_pointsAcc = this.pointsAcc, pointsAcc = orig_pointsAcc.concat(), new_points = points.concat(), pointsLen = new_points.length, i = 0; i < pointsLen; ++i) {
                    var unk_178 = pointsAcc[(i - 1 + pointsLen) % pointsLen], unk_179 = pointsAcc[(i + 1) % pointsLen];
                    orig_pointsAcc[i] += Math.random() - .5;
                    orig_pointsAcc[i] *= .7;
                    10 < orig_pointsAcc[i] && (orig_pointsAcc[i] = 10);
                    -10 > orig_pointsAcc[i] && (orig_pointsAcc[i] = -10);
                    orig_pointsAcc[i] = (unk_178 + unk_179 + 8 * orig_pointsAcc[i]) / 10;
                }
                for (var unk_180 = this, i = 0; i < pointsLen; ++i) {
                    pointsAcc = new_points[i].v;
                    unk_178 = new_points[(i - 1 + pointsLen) % pointsLen].v;
                    unk_179 = new_points[(i + 1) % pointsLen].v;
                    if (15 < this.size && null != unk_112) {
                        var unk_181 = !1, unk_182 = points[i].x, unk_183 = points[i].y;
                        unk_112.retrieve2(unk_182 - 5, unk_183 - 5, 10, 10, function(unk_184) {
                            unk_184.c != unk_180 && 25 > (unk_182 - unk_184.x) * (unk_182 - unk_184.x) + (unk_183 - unk_184.y) * (unk_183 - unk_184.y) && (unk_181 = !0);
                        });
                        !unk_181 && (points[i].x < unk_129 || points[i].y < unk_130 || points[i].x > unk_131 || points[i].y > unk_132) && (unk_181 = !0);
                        unk_181 && (0 < orig_pointsAcc[i] && (orig_pointsAcc[i] = 0), orig_pointsAcc[i] -= 1);
                    }
                    pointsAcc += orig_pointsAcc[i];
                    0 > pointsAcc && (pointsAcc = 0);
                    pointsAcc = (12 * pointsAcc + this.size) / 13;
                    points[i].v = (unk_178 + unk_179 + 8 * pointsAcc) / 10;
                    unk_178 = 2 * Math.PI / pointsLen;
                    unk_179 = this.points[i].v;
                    this.isVirus && 0 == i % 2 && (unk_179 += 5);
                    points[i].x = this.x + Math.cos(unk_178 * i) * unk_179;
                    points[i].y = this.y + Math.sin(unk_178 * i) * unk_179;
                }
            },
            updatePos: function() {
                var unk_185;
                unk_185 = (unk_127 - this.updateTime) / 120;
                unk_185 = 0 > unk_185 ? 0 : 1 < unk_185 ? 1 : unk_185;
                unk_185 = unk_185 * unk_185 * (3 - 2 * unk_185);
                this.getNameSize();
                if (this.destroyed && 1 <= unk_185) {
                    var unk_186 = unk_120.indexOf(this);
                    -1 != unk_186 && unk_120.splice(unk_186, 1);
                }
                this.x = unk_185 * (this.nx - this.ox) + this.ox;
                this.y = unk_185 * (this.ny - this.oy) + this.oy;
                this.size = unk_185 * (this.nSize - this.oSize) + this.oSize;
                return unk_185;
            },
            shouldRender: function() {
                return this.x + this.size + 40 < viewCenter_x - winWidth / 2 / zoomFactor || this.y + this.size + 40 < viewCenter_y - winHeight / 2 / zoomFactor || this.x - this.size - 40 > viewCenter_x + winWidth / 2 / zoomFactor || this.y - this.size - 40 > viewCenter_y + winHeight / 2 / zoomFactor ? !1 : !0;
            },
            draw: function() {
                if (this.shouldRender()) {
                    var unk_187 = !this.isVirus && .5 > zoomFactor;
                    mainCtx.save();
                    this.drawTime = unk_127;
                    var misc1 = this.updatePos();
                    this.destroyed && (mainCtx.globalAlpha *= 1 - misc1);
                    mainCtx.lineWidth = 10;
                    mainCtx.lineCap = "round";
                    mainCtx.lineJoin = this.isVirus ? "mitter" : "round";
                    noColor ? (mainCtx.fillStyle = "#FFFFFF", mainCtx.strokeStyle = "#AAAAAA") : (mainCtx.fillStyle = this.color, 
                    mainCtx.strokeStyle = this.color);
                    if (unk_187) mainCtx.beginPath(), mainCtx.arc(this.x, this.y, this.size, 0, 2 * Math.PI, !1); else {
                        this.movePoints();
                        mainCtx.beginPath();
                        misc1 = this.getNumPoints();
                        mainCtx.moveTo(this.points[0].x, this.points[0].y);
                        for (var misc2 = 1; misc2 <= misc1; ++misc2) {
                            var misc3 = misc2 % misc1;
                            mainCtx.lineTo(this.points[misc3].x, this.points[misc3].y);
                        }
                    }
                    mainCtx.closePath();
                    misc1 = this.name.toLowerCase();
                    showSkins && "" == unk_145 ? -1 != skinList.indexOf(misc1) ? (skinImages.hasOwnProperty(misc1) || (skinImages[misc1] = new Image(), 
                    skinImages[misc1].src = "skins/" + misc1 + ".png"), misc2 = skinImages[misc1]) : misc2 = null : misc2 = null;
                    misc1 = misc2 ? -1 != unk_165.indexOf(misc1) : !1;
                    unk_187 || mainCtx.stroke();
                    mainCtx.fill();
                    null != misc2 && 0 < misc2.width && !misc1 && (mainCtx.save(), mainCtx.clip(), mainCtx.drawImage(misc2, this.x - this.size, this.y - this.size, 2 * this.size, 2 * this.size), 
                    mainCtx.restore());
                    (noColor || 15 < this.size) && !unk_187 && (mainCtx.strokeStyle = "#000000", mainCtx.globalAlpha *= .1, 
                    mainCtx.stroke());
                    mainCtx.globalAlpha = 1;
                    null != misc2 && 0 < misc2.width && misc1 && mainCtx.drawImage(misc2, this.x - 2 * this.size, this.y - 2 * this.size, 4 * this.size, 4 * this.size);
                    misc2 = -1 != myBlobs.indexOf(this);
                    unk_187 = ~~this.y;
                    if ((showNames || misc2) && this.name && this.nameCache) {
                        misc3 = this.nameCache;
                        misc3.setValue(this.name);
                        misc3.setSize(this.getNameSize());
                        misc1 = Math.ceil(10 * zoomFactor) / 10;
                        misc3.setScale(misc1);
                        var misc3 = misc3.render(), unk_191 = ~~(misc3.width / misc1), unk_192 = ~~(misc3.height / misc1);
                        mainCtx.drawImage(misc3, ~~this.x - ~~(unk_191 / 2), unk_187 - ~~(unk_192 / 2), unk_191, unk_192);
                        unk_187 += misc3.height / 2 / misc1 + 4;
                    }
                    showMass && misc2 && (null == this.sizeCache && (this.sizeCache = new TextDisplayer(this.getNameSize() / 2, "#FFFFFF", !0, "#000000")), 
                    misc2 = this.sizeCache, misc2.setSize(this.getNameSize() / 2), misc2.setValue(~~(this.size * this.size / 100)), 
                    misc1 = Math.ceil(10 * zoomFactor) / 10, misc2.setScale(misc1), misc3 = misc2.render(), 
                    unk_191 = ~~(misc3.width / misc1), unk_192 = ~~(misc3.height / misc1), mainCtx.drawImage(misc3, ~~this.x - ~~(unk_191 / 2), unk_187 - ~~(unk_192 / 2), unk_191, unk_192));
                    mainCtx.restore();
                }
            }
        };
        TextDisplayer.prototype = {
            _value: "",
            _color: "#000000",
            _stroke: !1,
            _strokeColor: "#000000",
            _size: 16,
            _canvas: null,
            _ctx: null,
            _dirty: !1,
            _scale: 1,
            setSize: function(_size) {
                this._size != _size && (this._size = _size, this._dirty = !0);
            },
            setScale: function(_scale) {
                this._scale != _scale && (this._scale = _scale, this._dirty = !0);
            },
            setColor: function(_color) {
                this._color != _color && (this._color = _color, this._dirty = !0);
            },
            setStroke: function(_stroke) {
                this._stroke != _stroke && (this._stroke = _stroke, this._dirty = !0);
            },
            setStrokeColor: function(_strokeColor) {
                this._strokeColor != _strokeColor && (this._strokeColor = _strokeColor, this._dirty = !0);
            },
            setValue: function(_value) {
                _value != this._value && (this._value = _value, this._dirty = !0);
            },
            render: function() {
                null == this._canvas && (this._canvas = document.createElement("canvas"), this._ctx = this._canvas.getContext("2d"));
                if (this._dirty) {
                    this._dirty = !1;
                    var canv = this._canvas, ctx = this._ctx, value = this._value, scale = this._scale, size = this._size, font = size + "px Ubuntu";
                    ctx.font = font;
                    var textWidth = ctx.measureText(value).width, unk_206 = ~~(.2 * size);
                    canv.width = (textWidth + 6) * scale;
                    canv.height = (size + unk_206) * scale;
                    ctx.font = font;
                    ctx.scale(scale, scale);
                    ctx.globalAlpha = 1;
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = this._strokeColor;
                    ctx.fillStyle = this._color;
                    this._stroke && ctx.strokeText(value, 3, size - unk_206 / 2);
                    ctx.fillText(value, 3, size - unk_206 / 2);
                }
                return this._canvas;
            }
        };
        window.onload = onLoad;
    }
})(window, jQuery);