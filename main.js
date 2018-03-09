// Module Import
const electron = require('electron')
var OauthTwitter = require('electron-oauth-twitter');
var Twitter = require('twitter');
//var twit = require('twit');
var sqlite3 = require('sqlite3').verbose();

// get accessToken.db
var db = new sqlite3.Database('accessToken.db');

// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
var mongo = require('mongodb').MongoClient;

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

// Twitter API-Key
var _userId = null;
var _twitterConsumerKey = "yiUiM4aRyLwyDn8k7AveMvNFg";
var _twitterConsumerSecret = "QYVNcfrGQ5tIAgc1ObD4azoLSl4uy8H4a2FJ9N6mtIMp4XAbWV";
var _accessToken = null;
var _accessTokenSecret = null;
var _login = 0;

var dialog = require('electron').dialog;
 
var twitter = new OauthTwitter({
    key: _twitterConsumerKey,
    secret: _twitterConsumerSecret,
});

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  mainUrl = url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  })
  mainWindow.loadURL(mainUrl)
  db.run("create table if not exists token(_userId text ,_accessToken text, _accessTokenSecret text)");
  db.serialize(() => {
    db.serialize(() => {
        db.each("select EXISTS (select * from token where _accessToken is not null or _accessTokenSecret is not null)as success", function(err, row) {
          _login = row.success;
          console.log('first');
        }, ()=> {
          console.log('second');
          if(_login == 0){
            twitter.startRequest().then(function(result) {
              _accessToken = result.oauth_access_token;
              _accessTokenSecret = result.oauth_access_token_secret;
              _userId = _accessToken.split('-')[0]
              db.run("INSERT INTO token(_userId,_accessToken,_accessTokenSecret) VALUES(?,?,?)", [_userId,_accessToken,_accessTokenSecret], function(err) {
                if(err){
                  console.log(err)
                }
                else{
                  //twitterOauth()
                }
                db.close();
              });
            }).catch(function(error) {
              console.error(error, error.stack);
            });
          }else{
            db.each("select _userId ,_accessToken, _accessTokenSecret from token", function(err, row){
              _accessToken = row._accessToken;
              _accessTokenSecret = row._accessTokenSecret;
              _userId = row._userId;
              console.log('oauth', _userId);
              twitterOauth()
            })
          }
        });
    });
  });

  // Start main Oauth
  function twitterOauth(){
    console.log('start oauth');
    var client2 = new Twitter({
      consumer_key: _twitterConsumerKey,
      consumer_secret: _twitterConsumerSecret,
      access_token_key: _accessToken,
      access_token_secret: _accessTokenSecret
    });
   // var stream = client.stream('user');
    console.log()
    var stream2 = client2.stream('user');
    stream2.on('data', function(event) {
      console.log(event);
      console.log('user_id' , event.in_reply_to_user_id , _userId);
      if(event.in_reply_to_user_id == _userId){
        console.log('이건 멘션입니다.');
      } 
    });
 
    stream2.on('error', function(error) {
      throw error;
    });

       
    /*
    stream.on('tweet', function(tw){
      if(tw.in_)
            var text = tw.text;
            var screen_name = tw.user.screen_name;
            var user_name = tw.user.name;
            var time = tw.created_at;
            console.log(user_name +' ( @' + screen_name + ' ) ' + time + '\n' 
                                    + text +'\n');
            console.log(tw);
    });*/
  }
  
  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}
/*

*/
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.