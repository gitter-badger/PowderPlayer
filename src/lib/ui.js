$("#max-peers").text(localStorage.maxPeers);
$("#spinner").val(localStorage.maxPeers);
$("#def-folder").text(localStorage.tmpDir);
if (localStorage.libDir == "Temp") {
	$("#lib-folder").text("same as Download Folder");
} else $("#lib-folder").text(localStorage.libDir);
if (localStorage.clickPause == 'fullscreen') {
	$("#click-pause").text("only in Fullscreen");
} else $("#click-pause").text("Fullscreen + Windowed");
$('#open-url').css('top', Math.round(($(window).height() - 187) / 2)+'px');

if (localStorage.pulseRule == "disabled") {
	$("#menuPulsing").text("Enable Pulsing");
	playerMenu.items[0].submenu.items[4].checked = false;
}

if (localStorage.noSubs == "1") {
	$("#click-no-sub").text("False");
}

$("#click-pulse").text(localStorage.pulseRule);

$('#magnetLink').mousedown(function(event) {
    if (event.which == 3) {
		var clipboard = gui.Clipboard.get();
		$('#magnetLink').val(clipboard.get('text')).select();
    }
});

$(document).ready(function() {
	// initiate progress bars
    $('.progress .progress-bar').progressbar({display_text: 'center'});
	
	// initiate max peers selector (settings)
	$('#spinner').spinner({
		min: 10,
		max: 10000,
		step: 10
	});
	$('.ui-spinner').css("display","none");

});

function getReadableFileSizeString(fileSizeInBytes) {
    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
        fileSizeInBytes = fileSizeInBytes / 1024;
        i++;
    } while (fileSizeInBytes > 1024);
    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
}

function changeClickPause() {
	if (localStorage.clickPause == 'fullscreen') {
		$("#click-pause").text("Fullscreen + Windowed");
		localStorage.clickPause = "both";
	} else {
		$("#click-pause").text("only in Fullscreen");
		localStorage.clickPause = "fullscreen";
	}
}

function changePulseSetting() {
	if (localStorage.pulseRule == 'auto') {
		$("#click-pulse").text("always");
		localStorage.pulseRule = "always";
		if ($("#menuPulsing").text() == "Disable Pulsing") $("#menuPulsing").text("Enable Pulsing");
	} else if (localStorage.pulseRule == 'always') {
		$("#click-pulse").text("disabled");
		localStorage.pulseRule = "disabled";
		if ($("#menuPulsing").text() == "Enable Pulsing") $("#menuPulsing").text("Disable Pulsing");
	} else {
		$("#click-pulse").text("auto");
		localStorage.pulseRule = "auto";
		if ($("#menuPulsing").text() == "Disable Pulsing") $("#menuPulsing").text("Enable Pulsing");
	}
}

function switchPulsing() {
	if ($("#menuPulsing").text() == "Disable Pulsing") {
		localStorage.pulseRule = "disabled";
		$("#menuPulsing").text("Enable Pulsing");
		$("#click-pulse").text("disabled");
		playerMenu.items[0].submenu.items[4].checked = false;
	} else {
		localStorage.pulseRule = "auto";
		$("#menuPulsing").text("Disable Pulsing");
		$("#click-pulse").text("auto");
		playerMenu.items[0].submenu.items[4].checked = true;
	}
}

function changeNoSub() {
	if ($("#click-no-sub").text() == "True") {
		$("#click-no-sub").text("False");
		localStorage.noSubs = "1";
	} else {
		$("#click-no-sub").text("True");
		localStorage.noSubs = "0";
	}
}

function openPeerSelector() {
	if($('#max-peers').is(':visible')) $('#max-peers').hide(0,function() { $('.ui-spinner').show(0); })
}

$('#max-peers-hov').hover(function() { }, function() {
	if ($('.ui-spinner').is(":hover") === false) if ($('.ui-spinner').is(':visible')) $('.ui-spinner').hide(0,function() {
		$('#max-peers').text($('#spinner').val()).show(0);
		localStorage.maxPeers = parseInt($('#spinner').val());
	})
});

function playEl(kj) {
	if ($("#action"+kj).hasClass("play")) {
		$("#action"+kj).removeClass("play").addClass("pause").css("background-color","#F6BC24").attr("onClick","pauseEl("+kj+")");
		powGlobals.engine.files[powGlobals.files[kj].index].select();
	}
}

function pauseEl(kj) {
	if ($("#action"+kj).hasClass("pause")) {
		$("#action"+kj).removeClass("pause").addClass("play").css("background-color","#FF704A").attr("onClick","playEl("+kj+")");
		powGlobals.engine.files[powGlobals.files[kj].index].deselect();
	}
}

function settingsEl(kj) {
	if (parseInt($("#progressbar"+kj).attr("data-transitiongoal")) > 0) {
		$("#openAction").attr("onClick","gui.Shell.openItem(powGlobals['engine'].path+pathBreak+powGlobals['engine'].files[powGlobals['files']["+kj+"].index].path); $('#closeAction').trigger('click'); playEl("+kj+")");
		$("#openFolderAction").attr("onClick","gui.Shell.showItemInFolder(powGlobals['engine'].path+pathBreak+powGlobals['engine'].files[powGlobals['files']["+kj+"].index].path); $('#closeAction').trigger('click')");
		$("#openAction").show(0);
		$("#openFolderAction").show(0);
	} else {
		$("#openAction").hide(0);
		$("#openFolderAction").hide(0);
	}
	if (supportedVideo.indexOf($("#file"+kj).find(".filenames").text().split(".").pop().toLowerCase()) > -1) {
		// if the item is a video
		powGlobals.videos.some(function(el,ij) {
			if (el.index == kj) {
				$("#playAction").attr("onClick","wjs().playItem("+ij+"); $('#closeAction').trigger('click'); $('#inner-in-content').animate({ scrollTop: 0 }, 'slow'); playEl("+kj+"); $('#inner-in-content').css('overflow-y','hidden')");
				$("#copyStream").attr("onClick","gui.Clipboard.get().set('http://localhost:'+powGlobals['engine'].server.address().port+'/"+powGlobals.files[kj].index+"','text'); $('#closeAction').trigger('click')");
				$("#playAction").show(0);
				$("#copyStream").show(0);
				return false;
			}
		});
	} else {
		$("#playAction").hide(0);
		$("#copyStream").hide(0);
	}
	$("#open-file-settings").trigger("click");
}

function goBack(nextTorrent) {
	if (dlna.initiated) stopDlna();
	if (peerInterval) clearInterval(peerInterval);
	if (delaySetDownload) clearTimeout(delaySetDownload);
	savedHistory = 0;
	if (typeof nextTorrent === 'undefined') {
		correctPlaylist = {};
		disableCtxMenu();
		$("#inner-in-content").animate({ scrollTop: 0 }, 0);
		wjs().setOpeningText("Stopping");
		wjs().fullscreen(false);
		$("#header_container").css("display","none");
		$("#inner-in-content").css("overflow-y","hidden");
		if (parseInt($("#main").css("opacity")) == 0) $("#main").css("opacity","1");
		$('#main').css("display","table");	
		document.getElementById('magnetLink').value = "";
		$('#player_wrapper').css("min-height","1px").css("height","1px").css("width","1px");
		if ($("#open-url").hasClass("dark-add-url")) {
			$("#magnetSubmit").text("Stream");
			$("#open-url").removeClass("dark-add-url");
		}
		win.setMinimumSize(530, 440);
	
		if ((win.width < 530 && win.height < 440) || (win.width < 530 || win.height < 440)) {
			win.width = 530;
			win.height = 440;
		}
	
		if (onTop) {
			onTop = false;
			win.setAlwaysOnTop(false);
		}

		if ($(window).height() < $("#main").height() && !$("body").hasClass("mini")) {
			$("body").addClass("mini");
		} else if ($(window).width() < $("#main").width() && !$("body").hasClass("mini")) {
			$("body").addClass("mini");
		} else if ($(window).width() > 730 && $(window).height() > 650 && $("body").hasClass("mini")) {
			 $("body").removeClass("mini");
		}
		$('#open-url').css('top', Math.round(($(window).height() - 187) / 2)+'px');
		wjs().clearPlaylist();
	} else {
		wjs().setOpeningText("Loading resource");
		$("#header_container").show();
	}
	wjs().setDownloaded(0);
	if (powGlobals.engine) {
		clearTimeout(downSpeed);
		powGlobals.engine.swarm.removeListener('wire', onmagnet);
		if (nextStartDlna) { dlna.controls.stop(); }
		if (isReady) {
			isReady = 0;
			if (powGlobals.serverReady) {
				killEngine(powGlobals.engine);
				powGlobals = [];
				if (typeof nextTorrent !== 'undefined') {
					resetPowGlobals();
					addTorrent(nextTorrent);
				}
			} else {
				powGlobals.engine.destroy();
				powGlobals = [];
				if (typeof nextTorrent !== 'undefined') {
					resetPowGlobals();
					addTorrent(nextTorrent);
				}
			}
		} else {
			if (powGlobals.engine) powGlobals.engine.destroy();
			powGlobals = [];
			if (typeof nextTorrent !== 'undefined') {
				resetPowGlobals();
				addTorrent(nextTorrent);
			}
		}
	} else {
		isReady = 0;
		clearTimeout(downSpeed);
		if (typeof nextTorrent !== 'undefined') {
			resetPowGlobals();
			addTorrent(nextTorrent);
		}
	}
	
	firstTime = 0;
	if (typeof nextTorrent === 'undefined') {
		firstTimeEver = 1;
		firstSize = 1;
		win.title = "Powder Player";
		winTitleCenter("Powder Player");
	}
}

function printHistory() {
	$("#history-list").html("");
	historyObject = JSON.parse(localStorage.history);
	oi = 0;
	if (historyObject[oi.toString()]) {
		generateHistory = "";
		for (oi = 0; historyObject[oi.toString()]; oi++) {
			generateHistory += '<div onClick="loadHistory(JSON.parse(localStorage.history)['+oi.toString()+']); return false" class="actionButton history-item">'+historyObject[oi.toString()].title+'</div>';
		}
		if (oi < 7) $("#history-list").css('overflowY', 'auto');
		else $("#history-list").css('overflowY', 'scroll');
		$("#history-list").html(generateHistory);
	} else {
		generateHistory = "<div class=\"history-empty\">Your history is empty, watch something first.</span>";
		$("#history-list").css('overflowY', 'auto');
		$("#history-list").html(generateHistory);
	}
}

$('#use-player').on('change', function() {
	if (this.value == "VLC") {
		localStorage.useVLC = "1";
		$(".internal-opt").hide(0);
	} else if (this.value == "Internal") {
		localStorage.useVLC = "0";
		$(".internal-opt").show(0);
	}
});

if (localStorage.useVLC == "1") {
	$('#use-player').val('VLC');
	$(".internal-opt").hide(0);
}

function torrentData() {
	allowScrollHotkeys = false;
	if (wjs().fullscreen()) wjs().fullscreen(false);
	if (wjs().playing()) wjs().pause();
	win.setMinimumSize(448, 370);
	if ((win.width < 448 && win.height < 370) || (win.width < 448 || win.height < 370)) {
		win.width = 448;
		win.height = 370;
		$("#filesList").css("min-height",448);
		$("#inner-in-content").animate({ scrollTop: 448 }, "slow");
	} else {
		$("#filesList").css("min-height",$("#player_wrapper").height());
		$("#inner-in-content").animate({ scrollTop: $("#player_wrapper").height() }, "slow");
	}
	setTimeout(function() {
		win.title = powGlobals.engine.torrent.name;
		winTitleLeft(powGlobals.engine.torrent.name);
	},600);
	$("#inner-in-content").css("overflow-y","visible");
	if ($("#all-download").find(".progressbar-front-text").css("width") == "0px") $(window).trigger('resize');
}

function urlFormAction() {
	if ($('#main').css("display") == "table") resetPowGlobals();
	runURL(document.getElementById('magnetLink').value);
	$('.easy-modal-animated').trigger('closeModal');
}