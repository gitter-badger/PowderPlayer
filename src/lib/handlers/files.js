// drag and drop
// prevent default behavior from changing page on ped file
window.ondragover = function(e) { e.preventDefault(); return false };
window.ondrop = function(e) { e.preventDefault(); return false };

var holder = document.getElementById('holder');
holder.ondragover = function () { this.className = 'hover'; return false; };
holder.ondragleave = function () { this.className = ''; return false; };
holder.ondrop = function (e) {
  e.preventDefault();
  win.focus();
  resetPowGlobals();
  
  if (e.dataTransfer.files.length == 1) runURL(e.dataTransfer.files[0].path);
  else {
	  var newFiles = [];
	  for (var i = 0; i < e.dataTransfer.files.length; ++i) newFiles[i] = e.dataTransfer.files[i].path;
	  runMultiple(newFiles);
  }
  this.className = '';
  return false;
};
// end drag and drop

$('#torrentDialog').change(function(evt) {
	var torDial = $(this);
	checkInternet(function(isConnected) {
		if (isConnected) {
			resetPowGlobals();
			if (torDial.val().indexOf(";") > -1) runMultiple(torDial.val().split(";"));
			else runURL(torDial.val());
		} else $('.easy-modal-animated').trigger('openModal');
	});
});

$('#libraryDialog').change(function(evt) {
	$("#lib-folder").text($(this).val());
	localStorage.libDir = $(this).val();
});


$('#folderDialog').change(function(evt) {
	$("#def-folder").text($(this).val());
	localStorage.tmpDir = $(this).val();
});

$('#addPlaylistDialog').change(function(evt) {
	if ($(this).val().indexOf(";") > -1) $(this).val().split(";").forEach(function(e) { playlistAddVideo(e); });
	else playlistAddVideo($(this).val());
});

$('#fileDialog').change(function(evt) {
	resetPowGlobals();
	if ($(this).val().indexOf(";") > -1) runMultiple($(this).val().split(";"));
	else runURL($(this).val());
});

$('#subtitleDialog').change(function(evt) {
	  var targetSub = $(this).val();
	  if (["sub","srt","vtt"].indexOf(targetSub.split('.').pop().toLowerCase()) > -1) {
		  if (targetSub.indexOf("/") > -1) {
			  newString = '{"'+targetSub.split('/').pop()+'":"'+targetSub+'"}';
		  } else {
			  newString = '{"'+targetSub.split('\\').pop()+'":"'+targetSub.split('\\').join('\\\\')+'"}';
		  }
		newSettings = player.vlc.playlist.items[player.currentItem()].setting;
		if (window.IsJsonString(newSettings)) {
			newSettings = JSON.parse(newSettings);
			if (newSettings.subtitles) {
				oldString = JSON.stringify(newSettings.subtitles);
				newString = oldString.substr(0,oldString.length -1)+","+newString.substr(1);
			}
		} else newSettings = {};
		newSettings.subtitles = JSON.parse(newString);
		player.vlc.playlist.items[player.currentItem()].setting = JSON.stringify(newSettings);
		player.subTrack(player.subCount()-1);
		player.notify("Subtitle Loaded");
	  } else {
		  player.notify("Subtitle Unsupported");
	  }
});

function chooseFile(name) {
	$(name).trigger('click');
}