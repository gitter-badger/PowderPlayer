var rememberPlaylist = {};
var correctPlaylist = {};
var waitForNext = false;
var nextPlay = 0;
var keepCurrent = 0;
var keepState = "opening";

// detect if playlist item is a youtube link
function isYoutube(plItem) {
	if (wjs().plugin.playlist.items[plItem].mrl.indexOf("googlevideo.com") > -1 || wjs().plugin.playlist.items[plItem].mrl.indexOf("youtube.com/watch") > -1) return true;
	else return false;
}

function isPlaying() {
	if (controlPort && controlSecret && controllSocket) controllSocket.emit('event', { name: 'Playing' });
	if (waitForNext) {
		waitForNext = false;
		nextPlay = 0;
//		if (player.zoom() == 0) player.zoom(1);
		if (player.length()) player.find(".wcp-time-total").text(" / "+player.parseTime(player.length()));
	}
	if (!allowScrollHotkeys) setTimeout(function() { allowScrollHotkeys = true; },1000);
	clearTimeout(frameTimer);
	frameHidden = false;
	if (doSubsLocal == 1 && typeof powGlobals.engine === 'undefined') {
		wjs().setDownloaded(0.0000000000000000001);
		doSubsLocal = 0;
		if (localStorage.noSubs == "0") {
			clearTimeout(findHashTime);
			findHash();
		}
	}
	if (firstTime == 0 && focused === false && !wjs().fullscreen()) win.requestAttention(true);
	if (firstTime == 0) {
		wjs().vlc.playlist.mode = 1;
		if (tempSel > -1) tempSel = -1;
		if (typeof powGlobals.duration !== 'undefined') wjs().setTotalLength(powGlobals.duration);
		firstTime = 1;
		wjs().plugin.subtitles.track = 0;
		
		refreshCtxMenu(); // refresh context menu
		
		if (powGlobals.engine && wjs().length() > 0 && powGlobals.videos[wjs().currentItem()] && powGlobals.videos[wjs().currentItem()].byteLength) {
			powGlobals.pulse = Math.round(powGlobals.videos[wjs().currentItem()].byteLength / (wjs().length() /1000) *2);
			if (localStorage.pulseRule == "always" || (localStorage.pulseRule == "auto" && !focused)) powGlobals.engine.setPulse(powGlobals.pulse);
		}
	}
	if (firstTimeEver == 1) {
		firstTimeEver = 0;
		if (typeof localStorage.savedVolume !== 'undefined') setTimeout(function() { wjs().volume(localStorage.savedVolume); },100);
		setTimeout(function() { wjs().onVolume(function() { if (wjs().volume() > 0) localStorage.savedVolume = wjs().volume(); }); },101);
		if (!wjs().fullscreen()) {
			if (wjs().width() == 0 && wjs().height() == 0) firstTimeEver = 1;
			else if (isYoutube(0)) setTimeout(function() { wjs().refreshPlaylist(); },500); // fix youtube playlist titles
		}
	}
//	if (isYoutube(wjs().currentItem()) && win.title != wjs().plugin.playlist.items[wjs().currentItem()].title.replace("[custom]","")) win.title = wjs().plugin.playlist.items[wjs().currentItem()].title.replace("[custom]","");
	if ($("#inner-in-content").css("overflow-y") == "visible" || $("#inner-in-content").css("overflow-y") == "auto") $("#inner-in-content").animate({ scrollTop: 0 }, 'slow');
}

function gotVideoSize(width,height) {
	if (firstSize == 1) {
		firstSize = 0;
		win.setTransparent(false);
		resizeInBounds((wjs().width() + 12),(wjs().height() + 40));
		win.setTransparent(true);
		remHeight = wjs().height() + 40;
	}
}

function handleErrors() {
	if (controlPort && controlSecret && controllSocket) controllSocket.emit('event', { name: 'Error' });
	disableCtxMenu();
}

var tempSel = -1;

function isOpening() {
	if (controlPort && controlSecret && controllSocket) controllSocket.emit('event', { name: 'Opening' });
	if (waitForNext && tempSel != wjs().currentItem()) {
		player.stop(true);
		return;
	}
	if (powGlobals.currentIndex != wjs().currentItem() && !waitForNext) {
		if (castData.casting) stopDlna();
		keepCurrent = wjs().currentItem();
		if (wjs().plugin.playlist.items[wjs().currentItem()].mrl.indexOf("pow://") == 0 || wjs().plugin.playlist.items[wjs().currentItem()].mrl.indexOf("magnet:?xt=urn:btih:") == 0) {
			wjs().vlc.playlist.mode = 0;
			wjs().find(".wcp-status").text("");
			wjs().stop(true);
			waitForNext = true;
			tempSel = wjs().currentItem();
			wjs().refreshPlaylist();
			
			if (wjs().plugin.playlist.items[wjs().currentItem()].mrl.indexOf("pow://") == 0) {
				nextTorrent = "magnet:?xt=urn:btih:"+wjs().plugin.playlist.items[wjs().currentItem()].mrl.replace("pow://","");
//				win.title = wjs().plugin.playlist.items[wjs().currentItem()].title.replace("[custom]","");
				if (nextTorrent.indexOf("/") > -1 && isNaN(nextTorrent.split("/")[1]) === false) {
					nextTorrent = nextTorrent.split("/")[0];
				}
			} else nextTorrent = wjs().plugin.playlist.items[wjs().currentItem()].mrl;
			rememberPlaylist = retrievePlaylist();
			for (ijk = 0; ijk < wjs().itemCount(); ijk++) {
				if (isNaN(rememberPlaylist[ijk.toString()].mrl) === false) rememberPlaylist[ijk.toString()].mrl = "pow://"+powGlobals.engine.infoHash+"/"+rememberPlaylist[ijk.toString()].mrl;
			}
			wjs().setDownloaded(0);
			goBack(nextTorrent);
			return;
		}
		delete powGlobals.duration;
		delete powGlobals.fileHash;
		savedHistory = 0;
		subVoteSent = 0;
		powGlobals.currentIndex = wjs().currentItem();
		if (powGlobals.engine) {
			if (wjs().plugin) wjs().setOpeningText("Prebuffering ...");
			if (typeof powGlobals.videos[wjs().currentItem()] !== 'undefined' && typeof powGlobals.videos[wjs().currentItem()].local === 'undefined') {
				powGlobals.files.some(function(el,ij) { if (ij == powGlobals.videos[wjs().currentItem()].index) { playEl(ij); return true; } });
			}
//			if (powGlobals.videos[wjs().currentItem()]) win.title = getName(powGlobals.videos[wjs().currentItem()].filename);
			wjs().setDownloaded(0);
			
			if (powGlobals.videos && powGlobals.videos[wjs().currentItem()]) {
				powGlobals.filename = powGlobals.videos[wjs().currentItem()].filename;
				powGlobals.path = powGlobals.videos[wjs().currentItem()].path;
				if (typeof powGlobals.videos[wjs().currentItem()].byteLength !== 'undefined') {
					powGlobals.byteLength = powGlobals.videos[wjs().currentItem()].byteLength;
				} else {
					if (powGlobals.byteLength) delete powGlobals.byteLength;
				}
				if (typeof powGlobals.videos[wjs().currentItem()].local === 'undefined') {
					powGlobals.firstPiece = powGlobals.videos[wjs().currentItem()].firstPiece;
					powGlobals.lastPiece = powGlobals.videos[wjs().currentItem()].lastPiece;
				}
			} else {
				var fetchItem = wjs().currentItem(),
					fetchMRL = wjs().itemDesc(fetchItem).mrl;

				if (!powGlobals.videos) powGlobals.videos = [];
				
				powGlobals.filename = fetchMRL.substr(fetchMRL.lastIndexOf("/")+1);
				if (isWin) powGlobals.path = fetchMRL.replace("file:///","").split("/").join("\\");
				else powGlobals.path = fetchMRL.replace("file:///","");

				powGlobals.videos[fetchItem] = {};
				powGlobals.videos[fetchItem].filename = powGlobals.filename;
				powGlobals.videos[fetchItem].path = powGlobals.path;
				if (fetchMRL.indexOf("file:///") > -1) powGlobals.videos[fetchItem].local = 1;
				powGlobals.videos[fetchItem].byteLength = fs.statSync(powGlobals.videos[fetchItem].path).size;
//				win.title = getName(powGlobals.videos[fetchItem].filename);
				holdTorrent = true;
				tempSel = fetchItem;
				wjs().refreshPlaylist();
			}
			firstTime = 0;
			
			if (localStorage.noSubs == "0") {
				checkInternet(function(isConnected) {
					if (isConnected && powGlobals.byteLength) $.ajax({ type: 'GET', url: window.atob("aHR0cDovL3Bvd2Rlci5tZWRpYS9tZXRhRGF0YS9nZXQucGhwP2Y9")+encodeURIComponent(powGlobals.filename)+window.atob("Jmg9")+encodeURIComponent(powGlobals.hash)+window.atob("JnM9")+encodeURIComponent(powGlobals.byteLength), global: false, cache: false, success: readData });
				});
			}
		} else {
			if (wjs().plugin) wjs().setOpeningText("Loading resource");
			if (wjs().currentItem() > -1 && powGlobals.videos) {
//				if (!isYoutube(wjs().currentItem())) win.title = getName(powGlobals.videos[wjs().currentItem()].filename); // if not youtube, set window title
				powGlobals.filename = powGlobals.videos[wjs().currentItem()].filename;
				powGlobals.path = powGlobals.videos[wjs().currentItem()].path;
				doSubsLocal = 1;
			}
		}
	}
}

function changedPosition(position) {
	if (controlPort && controlSecret && controllSocket) controllSocket.emit('event', { name: 'Position', value: position });
	// start downloading next episode after watching more then 70% of a video
	if (position > 0.7) {
		if (wjs().currentItem() < (wjs().itemCount() -1)) {
			if (typeof powGlobals.videos[wjs().currentItem()+1] !== 'undefined' && typeof powGlobals.videos[wjs().currentItem()+1].local === 'undefined') {
				powGlobals.files.some(function(el,ij) { if (ij == powGlobals.videos[wjs().currentItem()+1].index) { playEl(ij); return false; } });
			}
		}
		
		if (subVoteSent == 0 && wjs().subTrack() > 0) {
			subVoteSent = 1;
			if (wjs().subDesc(wjs().subTrack()).url.indexOf("http://dl.opensubtitles.org/en/download/subencoding-utf8/file/") == 0) {
				var findSubId = wjs().subDesc(wjs().subTrack()).url.replace("http://dl.opensubtitles.org/en/download/subencoding-utf8/file/","");
				if (findSubId.indexOf(".") > -1) {
					findSubId = findSubId.substr(0,findSubId.indexOf("."));
					var subjectUrl = window.atob("aHR0cDovL3Bvd2Rlci5tZWRpYS9tZXRhRGF0YS9zZXRvcmRlci5waHA/Zj0=")+encodeURIComponent(powGlobals.filename)+window.atob("JmloPQ==")+encodeURIComponent(powGlobals.fileHash)+window.atob("JnN0PQ==")+findSubId;
					if (powGlobals.engine) subjectUrl += window.atob("Jmg9")+encodeURIComponent(powGlobals.engine.infoHash);
					$.ajax({ type: 'GET', url: subjectUrl, global: false, cache: false });
				}
			}
		}
	}
	if (position > 0.7 && savedHistory == 0) {
		savedHistory = 1;
		historyObject = JSON.parse(localStorage.history);
		isSafe = 1;
		for (oi = 0; historyObject[oi.toString()]; oi++) { if (historyObject[oi.toString()].title == wjs().plugin.playlist.items[wjs().currentItem()].title.replace("[custom]","")) isSafe = 0; }
		if (isSafe == 1) {
			for (oii = oi; oii > 0; oii--) if (historyObject[(oii -1).toString()]) historyObject[oii.toString()] = historyObject[(oii -1).toString()];
			historyObject["0"] = {};
			if (powGlobals.engine) historyObject["0"].infoHash = powGlobals.engine.infoHash;
			historyObject["0"].currentItem = wjs().currentItem();
			historyObject["0"].title = wjs().plugin.playlist.items[wjs().currentItem()].title.replace("[custom]","");
			historyObject["0"].playlist = retrievePlaylist();
			for (oi = 0; historyObject[oi.toString()]; oi++) { if (oi > 19) delete historyObject[oi.toString()]; }
			localStorage.history = JSON.stringify(historyObject);
		}
	}
}

function retrievePlaylist() {
	var plObject = {};
	for (ijk = 0; ijk < wjs().itemCount(); ijk++) {
		plObject[ijk.toString()] = {};
		plObject[ijk.toString()].title = wjs().plugin.playlist.items[ijk].title.replace("[custom]","");
		plObject[ijk.toString()].disabled = wjs().plugin.playlist.items[ijk].disabled;
		if (powGlobals.engine && powGlobals.videos[ijk] && powGlobals.videos[ijk].index) {
			plObject[ijk.toString()].contentType = require('mime-types').lookup(powGlobals.engine.files[powGlobals.files[powGlobals.videos[ijk].index].index].path);
		}
		if (wjs().plugin.playlist.items[ijk].mrl.substr(0,17) == "http://localhost:" && isNaN(wjs().plugin.playlist.items[ijk].mrl.split("/").pop()) === false) {
			plObject[ijk.toString()].mrl = parseInt(wjs().plugin.playlist.items[ijk].mrl.split("/").pop());
		} else {
			plObject[ijk.toString()].mrl = wjs().plugin.playlist.items[ijk].mrl;
		}
	}
	if (!correctPlaylist["0"]) correctPlaylist = plObject;
	return plObject;
}

function playlistIntegrity(remPlaylist) {
	var integrity = true;
	var allTitles = [],
		allMRLs = [],
		allHashes = [],
		kj = 0;
	
	while (remPlaylist[kj.toString()]) {
		var thisHash = false;
		if (remPlaylist[kj.toString()].mrl.indexOf("pow://") == 0) {
			thisHash = remPlaylist[kj.toString()].mrl.replace("pow://","").toLowerCase();
			if (thisHash.indexOf("/") > -1) thisHash = thisHash.substr(0,thisHash.indexOf("/"));
		}
		if (kj == 0 || (allTitles.indexOf(remPlaylist[kj.toString()].title) == -1 && allMRLs.indexOf(remPlaylist[kj.toString()].mrl) == -1)) {
			if (thisHash && allHashes.length == 0) allHashes.push(thisHash);
			else {
				if (thisHash && allHashes.indexOf(thisHash) == -1) allHashes.push(thisHash);
				else {
					integrity = false;
					break;
				}
			}
			allTitles.push(remPlaylist[kj.toString()].title);
			allMRLs.push(remPlaylist[kj.toString()].mrl); 
		} else {
			integrity = false;
			break;
		}
		kj++;
	}
	if (integrity) {
		correctPlaylist = remPlaylist;
		return remPlaylist;
	} else {
		if (correctPlaylist["0"]) return correctPlaylist;
		else return rememberPlaylist;
	}
}

function changedState() {
	if (wjs().state() != lastState) {
		if (controlPort && controlSecret && controllSocket) controllSocket.emit('event', { name: 'State', value: wjs().state() });
		keepState = wjs().state();

		// detect unsupported media types
		if ((lastState == "opening" || lastState == "playing" || lastState == "") && (wjs().state() == "ended" && wjs().itemCount() == 1 && firstTimeEver == 1) && (!isYoutube(wjs().currentItem()))) {
			goBack();
			$("#open-unsupported").trigger("click");
		}

		if (wjs().state() == "opening") lastItem = wjs().currentItem();
		else if (lastState == "opening" && wjs().state() == "ended") {
			if (powGlobals.engine) {
				if (wjs().plugin.playlist.items[lastItem].mrl.substr(0,17) == "http://localhost:") {
					if (!isWin) {
						wjs().replaceMRL(lastItem,{
							url: "file:///"+powGlobals.videos[lastItem].path,
							title: wjs().itemDesc(lastItem).title
						});
					} else {
						wjs().replaceMRL(lastItem,{
							url: "file:///"+powGlobals.videos[lastItem].path.split("\\").join("/"),
							title: wjs().itemDesc(lastItem).title
						});
					}
					setTimeout(function() { wjs().playItem(lastItem); },1000);
				}
			}
		}
		lastState = wjs().state();
	}
}

// get closest number from array
function closest(num, arr) {
	var curr = arr[0];
	var diff = Math.abs (num - curr);
	for (var val = 0; val < arr.length; val++) {
		var newdiff = Math.abs (num - arr[val]);
		if (newdiff < diff) {
			diff = newdiff;
			curr = arr[val];
		}
	}
	return curr;
}