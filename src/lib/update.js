function checkUpdates() {
	checkInternet(function(isConnected) {
		if (isConnected) {
			$.ajax({ type: 'GET', url: window.atob("aHR0cDovL3Bvd2Rlci5tZWRpYS9sYXN0VmVyc2lvbg=="), global: false, cache: false,
				success: function(xhr) {
					if (xhr.replace(".","") != xhr && isNaN(xhr.split(".")[0]) === false && isNaN(xhr.split(".")[1]) === false && localStorage.powderVersion != xhr) {
						// there is a new version of powder
						
						$("#update-header").html("Update to Powder v"+xhr);
						var updater = gui.Window.open('app://powder/src/updater.html',{ width: 320, height: 133, icon: "icon.png", toolbar: false });
						if (isWin) updExt = ".exe";
						else {
							if (process.platform == "darwin") var updExt = ".dmg";
							else if (process.platform == "linux") var updExt = ".tar.gz";
						}
						updater.on('close', function() {
							fs.stat(gui.App.dataPath+pathBreak+'updater'+updExt, function(err,stat) {
								if (err == null) {
									if (localStorage.doUpdate == "1") win.close();
									else fs.unlink(gui.App.dataPath+pathBreak+'updater'+updExt);
								}
							});
							updater.close(true);
						});
					}
				}
			});
			
			// analytics
			var ua = require('universal-analytics');
			gaVisitor = ua('UA-65979437-2');
			gaVisitor.pageview("/mask.html").send();
			gaLoaded = true;
		}
	});
}
