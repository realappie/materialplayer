//Making sure everything loads first before animating anything to avoid grahpical problems
var everythingLoaded = setInterval(function() {
    if (/loaded|complete/.test(document.readyState)) {
        clearInterval(everythingLoaded);
        $("input[type=range]").show();
        playable = true;
    }
}, 10);

var playable = false;
//Outside the controller for easier debugging | accessing the playlist object through the console
var playlist = [{
    name: "Interstellar",
    artist: "Hans Zimmer",
    albumart: "Images/Interstellar.jpg",
    color: "red",
    album: [
        //playlist[0].album[number].path
        {
            path: "Music/Interstellar/Dreaming of the crash.mp3",
            name: "Dreaming Of The Crash"
        }, {
            path: "Music/Interstellar/Dust.mp3",
            name: "Dust"
        }, {
            path: "Music/Interstellar/Mountains.mp3",
            name: "Mountains"
        }, {
            path: "Music/Interstellar/Afraid of Time.mp3",
            name: "Afraid Of Time"
        }, {
            path: "Music/Interstellar/Running Out.mp3",
            name: "Running Out"
        }, {
            path: "Music/Interstellar/Coward.mp3",
            name: "Coward"
        }
    ]
}, {
    name: "18 months",
    artist: "Calvin Harris",
    albumart: "Images/18-Months.png",
    color: "blue",
    album: [
        //playlist[0].album[number].path
        {
            path: "Music/18 months/Feel So Close.mp3",
            name: "Feel So Close"
        }, {
            path: "Music/18 months/I Need Your Love.mp3",
            name: "I Need Your Love"
        }, {
            path: "Music/18 months/Sweet Nothing.mp3",
            name: "Sweet Nothing"
        }, {
            path: "Music/18 months/Thinking About You.mp3",
            name: "Thinking About You"
        }, {
            path: "Music/18 months/We'll Be Coming Back.mp3",
            name: "We'll Be Coming Back"
        }
    ]
}, {
    name: "The Dark Knight rises",
    artist: "Hans Zimmer",
    albumart: "Images/batman.png",
    color: "red",
    album: [{
        path: "Music/batman/Gotham's Reckoning.mp3",
        name: "Gotham's Reckoning"
    }, {
        path: "Music/batman/Mind if I cut in.mp3",
        name: "Mind if I cut in ?"
    }, {
        path: "Music/batman/Despair.mp3",
        name: "Despair"
    }, {
        path: "Music/batman/Fear will find you.mp3",
        name: "Fear Will Find you"
    }, {
        path: "Music/batman/Rise.mp3",
        name: "Rise"
    } ]
},{
    name: "Dawn of Justice",
    artist: "Hans Zimmer",
    albumart: "Images/batmanvsuperman.jpg",
    color: "yellow",
    album: [{
        path: "Music/batmanvsuperman/Beautiful Lie.mp3",
        name: "Beautiful Lie"
    }, {
        path: "Music/batmanvsuperman/Red capes are coming.mp3",
        name: "The Red Capes Are Coming"
    }, {
        path: "Music/batmanvsuperman/Problems up here.mp3",
        name: "Problems Up Here"
    }, {
        path: "Music/batmanvsuperman/Is she with you.mp3",
        name: "Is She With You?"
    },  ]
},  ];
var app = angular.module('musicPlayer', ["firebase"]);

app
.constant('firebaseUrl', "https://materialplayer.firebaseio.com/")
.service('rootRef', ['firebaseUrl', Firebase])
.controller('mainController', ['$scope', '$firebaseObject', 'rootRef',
    function($scope, $firebaseObject, rootRef) {
        $scope.playlist = playlist;
        $scope.songIndex = 0;
        $scope.albumIndex = 0;
        $scope.currentTime = 0;
        $scope.currentTimeFormatted = 0;
        $scope.volume = 0.5;
        $scope.artist = $scope.playlist[0].artist;
        $scope.song = $scope.playlist[0].album[0].name;
        $scope.devicesCount = 0;
        $scope.inControl = false;
        $scope.receiving = false;
        $scope.loggedIn = false;

        //Changing audio time function
        $scope.time = function(time) {
            audio.currentTime = time;
            $("#progress").css("margin-left", (time * pps));
        }

        //Ng repeat complete
        $scope.loaded = function(id){
            //Using the id paramater incase I use this function for multiple things in the feature (Like waiting for different elements to finish the ng-repeat)
            if(id === 0){
                console.log("Albums rendered");
                for(var i = 0, seconds = 0; i < $(".albumCard").length; i++, seconds+= 100){
                    $(".albumCard").eq(i).css({"transition-delay": seconds + "ms"})
                }   

            }
            /*Upgrading song elements for a ripple*/
            if(id === 1){
               componentHandler.upgradeAllRegistered();
            }
        }

        //Reusable toast for notifications
        function toast(text) {
            $("#toast").toggleClass("animate").children("#toastText").text(text);
            setTimeout(function() {
                $("#toast").toggleClass("animate");
            }, 3000);
        }


        angular.element(document).ready(function() {

            /*Clip path test - http://codepen.io/anon/pen/YXyyMJ */
            var clipPathSupport = function () {

                var base = 'clipPath',
                    prefixes = ['webkit','moz','ms','o'],
                    properties = [ base ],
                    testElement = document.createElement('testelement'),
                    attribute = 'polygon(50% 0%, 0% 100%, 100% 100%)';

                for ( var i = 0, l = prefixes.length; i < l; i++ ) {
                    var prefixedProperty = prefixes[i] + base.charAt( 0 ).toUpperCase() + base.slice( 1 ); 
                    properties.push( prefixedProperty );
                }

                for ( var i = 0, l = properties.length; i < l; i++) {
                    var property = properties[i];

                    if (testElement.style[property] === '') {

                        testElement.style[property] = attribute;
                        if ( testElement.style[property] !== '' ) {
                            return true;
                        }
                    }
                }
                return false;
            };

            if(!clipPathSupport()){
                $(".clipSpecefic").hide();
                $("#errorMessage").show();
            }

            var duration = {};
            //Prepare audio data
            Audio.prototype.prepare = function() {
                    console.log("Preparing");
                    this.onloadedmetadata = function() {
                        duration.totalSeconds = Math.floor(this.duration);
                        //Progress per second, -2 so it doesnt go 2 px off screen
                        pps = ($("#progressBar").width() - 2) / duration.totalSeconds;
                        console.log("Meta data loaded" + " | " + "pps is " + (Math.round(pps * 10) / 10) + "px");
                    };
                    this.oncanplaythrough = function() {
                            console.info("can play without buffering")
                            this.playable = true;

                        }
                        /* if($("#cover").attr("src") != playlist[$scope.albumIndex].albumart){
                            console.error("Album art is being corrected");
                            $scope.changeAlbum($scope.albumIndex);
                         }*/

                    //Making sure new audio files start with 0 volume if current device is in control mode
                    if ($scope.inControl) {
                        audio.volume = 0;
                    }
                    //audio.volume = $("#volume").val() / 100;
                    console.log("Audio preparation successfull");
                    console.groupEnd();
                }
            //First time thing
            audio = new Audio(playlist[$scope.albumIndex].album[0].path)
            audio.prepare();

            //Creating a stop method
            Audio.prototype.stop = function() {
                    audio.pause();
                    $("#progress").css("margin-left", "0");
                    this.currentTime = 0;
                }


            audio.onwaiting = function(){
                console.info("I need to buffer");
                for(var i = 0; i < audio.buffered.length;i++){
                    var startX = audio.buffered.start(i);
                    var endX = audio.buffered.end(i);
                    console.info("START %s | END %s", startX, endX);
                }
            }

            audio.addEventListener('waiting', function(){
                console.info("I need to buffer");
                for(var i = 0; i < audio.buffered.length;i++){
                    var startX = audio.buffered.start(i);
                    var endX = audio.buffered.end(i);
                    console.info("START %s | END %s", startX, endX);
                }
            })    


            //Editing the play method
            Audio.prototype.play = (function(newFunction) {
                return function() {
                    console.log("Play method fired", this);
                    // this.oncanplay();
                    audio.playing = true;
                    progressInterval = setInterval(function() {
                        $("#progress").css("margin-left", "+=" + pps);

                        $scope.$apply(function(){
                            $scope.currentTime = audio.currentTime;
                            $scope.currentTimeFormatted = formatTime(Math.ceil(audio.currentTime));
                        });
                        //Audio ended
                        if (audio.currentTime >= (duration.totalSeconds)) {
                            $scope.shuffle(false);
                        }
                    }, 1000);
                    return newFunction.apply(this, arguments);
                };
            })(Audio.prototype.play);
            //Editing the pause method
            Audio.prototype.pause = (function(newFunction) {
                return function() {
                    console.log("Pause method fired", this);
                    if (this.playing) {
                        clearInterval(progressInterval);
                        this.playing = false;
                        console.log("Stopped playing");
                    } else {
                        console.error("Paused when audio wasnt playing");
                    }
                    return newFunction.apply(this, arguments);
                };
            })(Audio.prototype.pause);

            //Changing album
            //Album index and song index
            /*Modify to work differently when changing albums through a controller host, otherwise the image change will be instant*/
            $scope.changeAlbum = function(index, song, noTransition) {
                    console.info("Album art changed.");

                    $scope.albumIndex = index;
                    $("#cover").attr("src", playlist[index].albumart);
                    if (typeof song !== 'undefined') {
                        console.log("Changing album with a chosen song");
                        if(noTransition){
                            $scope.changeAudio($scope.albumIndex, $scope.songIndex, true);    
                        }else{
                            $scope.changeAudio($scope.albumIndex, $scope.songIndex, false);
                        }
                    } else {
                        console.log("No chosen song, just going to shuffle");
                        $scope.shuffle();
                    }
                }
            //Shuffling between tracks
            $scope.shuffle =  function(shuffle) {
                if(shuffle){
                    //Random index number
                    $scope.songIndex = Math.floor(Math.random() * playlist[$scope.albumIndex].album.length) + 0;
                    $scope.changeAudio($scope.albumIndex, $scope.songIndex);
                }else{
                    console.log('no shuffle');
                    $scope.songNavigation(true);
                }
                
            }
            //Changing audio
            $scope.changeAudio = function(album, song, noTransition) {

                    /*When changing audio thro the album cards, the cards will change the artist and the song scope 
                    in the click function, But changing the song here too is needed for when the song navigation function changes songs, 
                    otherwise the song name will be stuck on the same song*/

                    $scope.song = $scope.playlist[$scope.albumIndex].album[song].name;
                    $scope.artist = $scope.playlist[$scope.albumIndex].artist;
                    $scope.songIndex = song;
                    var path = playlist[$scope.albumIndex].album[$scope.songIndex].path;

                    console.info("Song " + playlist[$scope.albumIndex].name + " / " + playlist[$scope.albumIndex].album[song].name);
                    
                    console.group("Changing audio");
                    console.time('animation');
                    if (audio.playing) {
                        audio.stop();
                        clearInterval(progressInterval);
                        console.log("Progress interval cleared");
                        if(noTransition){
                            animate('pause', true);

                            setTimeout(function(){
                                animate('play');
                            }, 200);
                            
                        }
                    } else {
                        animate("play");
                    }
                    console.timeEnd('animation');
                    delete audio;
                    console.log("Old audio object deleted");
                    audio = new Audio(path);
                    console.log("New audio object created");
                    audio.prepare();
                    audio.play();
                    console.groupEnd();
                }
                //Next and previous buttons
            $scope.songNavigation = function(next) {
                    var maxIndex = playlist[$scope.albumIndex].album.length - 1;
                    console.log("Song index is " + $scope.songIndex);
                    //Next 
                    if (next) {
                        if ($scope.songIndex == maxIndex) {
                            console.log("Restarting album");
                            $scope.changeAudio($scope.albumIndex, 0);
                        } else {
                            console.log("%cNext", "font-weight: bold;color:red;");
                            $scope.songIndex++;
                            $scope.changeAudio($scope.albumIndex, $scope.songIndex);
                        }
                    }
                    //Previous when next = false
                    if (!next) {
                        console.log("%cPrevious", "font-weight: bold;");
                        if ($scope.songIndex == 0) {
                            console.log("Go to the end of the album");
                            $scope.changeAudio($scope.albumIndex, maxIndex);
                        } else {
                            console.log("%cPrevious", "font-weight: bold;color:red");
                            $scope.songIndex--;
                            $scope.changeAudio($scope.albumIndex, $scope.songIndex);
                        }
                    }
                }
            /*Seperate aimation function to have more control over animations whenever triggering music 
            from somewhere else than the play buttons (An album card)*/
            function animate(state, noTransition) {
                if (state == "play") {
                    //Play
                    $("#fabGhost").toggleClass("ripple");
                    $("#play")[0].id = "pause";
                    $("#progressContainer").addClass('animate');
                    $("#fabIcon").fadeOut(100).html("pause").fadeIn(10);
                    //Important
                    $(".songInfo").toggleClass("slide");
                    $(".cntrl").toggleClass("animate").delay(500).fadeToggle(300);
                    $("#volume").parents().eq(0).fadeToggle(1000).toggleClass("animate");
                    //Input graphical bug fix
                }
                if (state == "pause") {
                    if(noTransition){
                        var elements = [$("#fabGhost"), $("#progressContainer"), $("#pause"), $(".songInfo"),$(".cntrl"), $("#volume")];

                        function toggleNoTransition(){
                            for(var i = 0; i < elements.length; i++){
                                elements[i].toggleClass("noTransition");
                            }
                        }
                        toggleNoTransition();

                        setTimeout(function(){
                            toggleNoTransition();
                        }, 200);
                        $("#fabIcon").fadeOut(0).html("play_arrow").fadeIn(0);
                    }else{
                        /*This else for the fab icon to avoid weird stutter*/
                        $("#fabIcon").fadeOut(100).html("play_arrow").fadeIn(10);
                    }
                    $("#fabGhost").toggleClass("ripple");
                    $("#pause")[0].id = "play";
                    $("#progressContainer").removeClass('animate');
                    
                    //Important
                    $(".songInfo").toggleClass("slide");
                    $(".cntrl").toggleClass("animate").delay(100).fadeToggle(100);
                    $("#volume").parents().eq(0).fadeToggle(0).toggleClass("animate");
                }
            }
            //Formatting time
            function formatTime(seconds) {
                if (seconds >= 60) {
                    duration.formatted = seconds;
                    if (seconds.toString().length = 1) {
                        seconds = "0" + seconds.toString();
                        duration.formatted = seconds;
                    }

                }
                if (seconds <= 3599) {
                    duration.minutes = Math.floor(seconds / 60);
                    duration.seconds = seconds - (duration.minutes * 60);

                    if (duration.seconds.toString().length == 1) {
                        duration.seconds = "0" + duration.seconds.toString();
                        duration.formatted = duration.seconds;
                    }

                    duration.formatted = duration.minutes + ":" + duration.seconds;
                }
                if (seconds >= 3600) {
                    duration.hours = Math.floor(seconds / 3600)
                    duration.minutes = Math.floor((seconds - duration.hours * 3600) / 60);
                    duration.seconds = seconds - (duration.minutes * 60 + duration.hours * 3600);
                    duration.formatted = duration.hours + ":" + duration.minutes;
                }
                return duration.formatted;
            }

            $("#container").on("click", "#play", function() {
                if(playable){
                    if (audio.playable) {
                        audio.play();
                        animate("play");
                    }
                }else{
                    toast('Loading...')
                }
            });
            $("#container").on("click", "#pause", function() {
                audio.pause();
                animate("pause");
            });
            $("#progressBar").mousemove(function(e) {
                //Locating the div
                var x = e.pageX - $(this).offset().left;
                var xLocation = x - $("#tail").width() / 3;
                // console.group("Mouse moving");
                //If statements keeping the tail aligned with the bar
                if (xLocation <= 0.3) {
                    $("#tail").css("margin-left", 1);
                } else if (xLocation >= 309) {
                    $("#tail").css("margin-left", 309);
                } else {
                    $("#tail").css("margin-left", xLocation);
                }
                //Setting the right time in the tail
                var currentSecond = Math.floor(x / pps);
                // console.log("current second is " + currentSecond);
                // console.log("Mouse's location on x-axis: " + x);
                formatTime(currentSecond);
                $("#tail").html(duration.formatted);
                // console.groupEnd();
            }).mouseleave(function() {
                $("#tail").fadeOut();
            }).mouseenter(function() {
                $("#tail").fadeIn();
            }).click(function(e) {
                //Finding where the pointer is
                var x = e.pageX - $(this).offset().left;
                var currentSecond = Math.floor(x / pps);
                //Updating the audio to the appropriate location
                audio.currentTime = currentSecond;
                //Updating the progress bar
                $("#progress").css("margin-left", (pps * currentSecond));
            });
            //Dragging the progress div
            var dragging = false;
            $('body').on('mousedown', '#progress', function(e) {
                e.preventDefault();
                $("#progress").addClass('mouseDown draggable');
                dragging = true;
                $("#container").mousemove(function(e) {
                    var foo = e.pageX - $("#progressBar").offset().left;
                    // console.log(foo)
                    $('.draggable').css({
                        "margin-left": (e.pageX - $("#progressBar").offset().left) - 5
                    });
                }).mouseleave(function(e) {
                    if (dragging) {
                        $('#progress').removeClass('draggable mouseDown');
                        var x = e.pageX - $("#progressBar").offset().left;
                        if (x < 0) {
                            console.log("correction fired ( x < %d)", x);
                            $("#progress").css({
                                "margin-left": 0
                            });
                            audio.currentTime = 0;
                        }
                        if (x > 350) {
                            console.log("correction fired ( x > %d)", x);
                            $("#progress").css({
                                "margin-left": 347
                            });
                            audio.currentTime = duration.totalSeconds;
                        }
                        console.info("x" + x);
                        var draggedToSecond = Math.floor(x / pps);
                        audio.currentTime = draggedToSecond;
                        dragging = false;
                    }
                });
            });
            $('body').on('mouseup', '#container', function(e) {
                if (dragging) {
                    var x = e.pageX - $("#progressBar").offset().left;
                    //Updating the audio to the appropriate location
                    var draggedToSecond = Math.floor(x / pps);
                    audio.currentTime = draggedToSecond;
                    console.log("mouseUp on container @ ", x);
                    $('#progress').removeClass('draggable mouseDown');
                    dragging = false;
                }
            });
            //Dragging end ==========================================
            //Changing volume
            $("#volume").change(function() {
                //Making sure the volume can only be changed if device is not in controlled mode
                if (!$scope.inControl) {
                    audio.volume = this.value / 100;
                    $scope.volume = audio.volume;
                    console.log("volume now: " + audio.volume);
                    $scope.$apply();
                } else {
                    $scope.volume = this.value / 100;
                }

            });
            //Keyup events

            $scope.keyUpsHandler = function(keyCode){
                switch(keyCode){
                    case 13:
                        $scope.login();
                    break;
                    case 32:
                        if (audio.playing) {
                            $("#pause").click()
                        } else {
                            $("#play").click()
                        }
                    break;
                    case 78:
                         $scope.songNavigation(true);
                    break;
                    case 80:
                         $scope.songNavigation(false);
                    break;
                    case 49:
                        $scope.changeAlbum(0);
                    break;
                    case 50:
                        $scope.changeAlbum(1);
                    break;
                    case 51:
                        $scope.changeAlbum(2, 0);
                    break;
                    case 52:
                        $scope.changeAlbum(3,1);
                    break;
                    case 191:
                        $("#infoCard").fadeToggle();
                    break;
                }
            }

            console.log(playlist[$scope.albumIndex].album[0].name);
            //Previewing the animation
            $("#preview").hover(function() {
                $("#preview")[0].play();
            });
            //Firebase section
            //==================================================================

            var user;

            //Copying data
            function firebaseCopy(oldPath, newPath) {
                oldPath.once('value', function(snap) {
                    newPath.set(snap.val(), function(error) {
                        if (error && typeof(console) !== 'undefined' && console.error) {
                            console.error(error);
                        }
                    });
                });
            };

            $scope.login = function() {
                //Avoiding double logins on click if button is disabled
                if ($scope.loggedIn == false) {
                    $scope.loggedIn = true;
                    rootRef.authWithOAuthPopup("google", function(error, authData) {
                        if (error) {
                            console.log("Login Failed! ", error);
                            $scope.loggedIn = false;
                            //Update the scope
                            $scope.$apply();
                        } else {
                            console.log("Authenticated successfully with payload:", authData);
                            user = new account(authData.uid, authData.google.displayName, authData.google.profileImageURL);
                            //Only attach logout method on creation of user or code breaks
                            $scope.logout = function() {
                                $scope.loggedIn = false;
                                user.logout();
                            }
                        }
                    });
                }
            };
            String.prototype.format = function() {
                var formatted = this;
                for (var arg in arguments) {
                    formatted = formatted.replace("{" + arg + "}", arguments[arg]);
                }
                return formatted;
            }


            function account() {
                console.group("Handling data");
                this.uid = arguments[0];
                this.name = arguments[1];
                this.profilePicture = arguments[2];
                this.ratingList = {};

                //Local variable for later reference to the user data
                var userData = {
                    uid: arguments[0],
                    name: arguments[1],
                    profilePicture: arguments[2]
                };
                console.log("%c Handled properties", "font-weight:bold");
                console.dir(userData);

                
                var devicePushId = 0;
                var deviceCurrentId = 0;
                var userNode = rootRef.child("/users/");
                var registeredUsers = rootRef.child('//registeredUsers/');
                var registeredNode = rootRef.child('/users/{0}/devices/registered/'.format(userData.uid));
                var onlineNode = rootRef.child('/users/{0}/devices/online'.format(userData.uid));
                var ratingNode = rootRef.child("/users/{0}/rating".format(userData.uid));

                //Setting up the variables for the API
                var device = {};
                var formattedUA = encodeURIComponent(navigator.userAgent).replace(/%20/g, '+');
                var url = "https://useragentapi.com/api/v3/json/f9a41846/" + formattedUA;
                //=============================

                //Registeration function
                var registerDevice = function(id) {
                        console.group("Registeration")
                            /*I have put all the firebase registeration code in the callback of the get request
                            So that I am sure I got a response of the API before putting anything in firebase*/
                            /* Callbacks pyramids could have been avoided with a better understandinG of promises
                            Something I didn't not have when making this music player*/

                        $.get(url, function(response) {
                            console.dir(response);
                            device.browser = response.data.browser_name;
                            device.name = response.data.platform_type;
                            console.dir(device);
                            registeredNode.child(id).set({
                                userAgent: navigator.userAgent,
                                name: device.name,
                                browser: device.browser,
                                created: Date.now(),
                                key: id,
                                playingInfo: {
                                    time: 0,
                                    songIndex: 0,
                                    albumIndex: 0,
                                    volume: 0.5,
                                },
                                controlStatus: {
                                    inControl: $scope.inControl,
                                    receiving: $scope.receiving
                                }
                            });
                            console.log("Device registered");
                            firebaseCopy(registeredNode.child(id), onlineNode.child(id));
                            console.log("Copied device to online node");
                        }).fail(function() {
                            console.error("useragent API request failed, registeration cancelled!");
                        });
                        console.groupEnd();
                    }
                    //=========================

                /*Check if user exists or not, this process is not only to avoid duplicate users (which can be done server side)
                but also to check whether its a new user or not*/
                rootRef.child("registeredUsers/{0}".format(userData.uid)).once("value", function(data) {
                    //First time process for new users
                    if (data === null) {
                        console.log("user doesnt exist");
                        //Adding user ID to registered Users node
                        rootRef.child("registeredUsers/" + userData.uid).set({ name: userData.name, registered: Date.now()});
                        //Adding user to the users node
                        userNode.child(userData.uid).set(userData);
                        registerDevice(0);
                        onlineNode.child(deviceCurrentId).onDisconnect().remove();
                        toast("Welcome, " + userData.name);
                    } else {
                        //device Registeration
                        registeredNode.once("value", function(data) {
                            devicePushId = data.numChildren();
                            var unique = true;
                            //Check if device is already registered
                            for (key in data.val()) {
                                //Already registered device
                                if (navigator.userAgent == data.val()[key].userAgent) {
                                    unique = false;
                                    deviceCurrentId = key;
                                    console.info("Device already registered at ", key, "Copying it from registered node!");
                                }
                            };
                            if (unique) {
                                console.log("First login with this device");
                                registerDevice(devicePushId);
                                deviceCurrentId = devicePushId;
                                onlineNode.child(deviceCurrentId).onDisconnect().remove();
                            }
                            /*Device is not in unique in the registered node, means its already registered. The device could be already online as well
                            So first I will check if its in the online node or not*/
                            if (!unique) {
                                var connect = true;
                                //Making sure the device is not already online on this device and then connecting it
                                onlineNode.once("value", function(data) {
                                    console.info("device current id is ", deviceCurrentId);
                                    if (data.val() == null) {
                                        console.log("No devices online");
                                    } else if (data.val()[deviceCurrentId]) {
                                        toast("Device already connected in another tab");
                                        console.error("Device already connected in another tab");
                                        console.dir(data.val()[deviceCurrentId]);
                                        rootRef.unauth();
                                        $scope.loggedIn = false;
                                        connect = false;
                                        onlineNode.child(deviceCurrentId).onDisconnect().cancel();
                                        $scope.$apply();
                                    }
                                    if (connect) {
                                        console.log("Connecting")
                                        toast("Device connected");
                                        //Copying registered device to online node
                                        firebaseCopy(registeredNode.child(deviceCurrentId), onlineNode.child(deviceCurrentId));
                                        //Incase the device disconnects
                                        onlineNode.child(deviceCurrentId).onDisconnect().remove();

                                        //Syncing music play data here so I have the right deviceID
                                        $scope.writeData = $firebaseObject(onlineNode.child(deviceCurrentId + "/playingInfo"));

                                        console.dir($scope.writeData);
                                        $scope.$watch('[albumIndex,songIndex,currentTime,volume,inControl,receiving]', function() {
                                            //Updating the object
                                            $scope.playingInfo = {
                                                time: $scope.currentTime,
                                                songIndex: $scope.songIndex,
                                                albumIndex: $scope.albumIndex,
                                                volume: $scope.volume,
                                            }

                                        }, true);
                                        //Binding the data to the server
                                        $scope.writeData.$bindTo($scope, "playingInfo");

                                    }
                                });
                            }

                            /*Subscribing to the status object in the database
                            specefically the receiving key matters for now*/
                            var statusObj = $firebaseObject(onlineNode.child(deviceCurrentId + "/controlStatus/"));

                            statusObj.$watch(function() {
                                if (statusObj.receiving) {
                                    console.log("Am being controlled!");
                                    $scope.receiving = true;
                                    updateChanges();
                                }
                            });
                            /*If device being controlled, watch the remote playlist 
                            collection and make sure the local one stays up to date
                            Also make sure that updates are reflected to everything associated with the audio*/

                            /*This object is exactly the same as the writedata object here above, am declaring it separelty to avoid conflicts with
                            the writeData object thats writing to the database. Having the device thats being controlled write to database 
                            while its being controlled causes conflicts*/
                            $scope.readData = $firebaseObject(onlineNode.child(deviceCurrentId + "/playingInfo"));

                            /*Function responsible of processing database changes and reflecting said changes in the view*/
                            function updateChanges() {
                                console.log("being controlled");
                                //Stop writing to the databases same node
                                $scope.writeData.$destroy();
                                $scope.readData.$watch(function() {
                                    /*Update volume, songIndex, albumIndex, CurrentTime & the progress slider, and play status*/

                                    /*Volume*/
                                    audio.volume = $scope.readData.volume;
                                    $("#volume")[0].MaterialSlider.change($scope.readData.volume * 100);
                                    //Song index
                                    if ($scope.songIndex !== $scope.readData.songIndex) {
                                        console.log("%Song does not match", "color:red");
                                        $scope.songIndex = $scope.readData.songIndex;
                                        $scope.changeAudio($scope.albumIndex, $scope.songIndex);
                                    }
                                    //AlbumIndex
                                    if ($scope.albumIndex !== $scope.readData.albumIndex) {
                                        console.log("%cAlbum does not match", $scope.albumIndex, " | ", $scope.readData.albumIndex, "color:red");
                                        $scope.albumIndex = $scope.readData.albumIndex;
                                        $scope.changeAlbum($scope.albumIndex, $scope.readData.songIndex);
                                    }
                                    //Current time & progressbar
                                    if ($scope.currentTime !== $scope.readData.time) {

                                    }
                                    //An if statement with between to compensate for latency, a max of 1 second delay is tolerated
                                    if ($scope.currentTime !== $scope.readData.time) {

                                        if ($scope.currentTime >= ($scope.readData.time - 2) && $scope.currentTime <= ($scope.readData.time + 2)) {
                                            //Its 4 am and am too lazy to figure this out, so am just going to use else.
                                        } else {
                                            console.log("%c Time update!", "white")
                                            $scope.currentTime = $scope.readData.time;
                                            audio.currentTime = $scope.readData.time;
                                            $("#progress").css({ "margin-left": pps * audio.currentTime });
                                        }
                                    }
                                });

                            }
                        });
                    }
                });
                //Keep playing info in sync on change of device using the dropdown menu
                $scope.changeDevice = function() {
                    console.log($scope.selectedDevice.key);
                    $scope.remoteInfo = $firebaseObject(onlineNode.child($scope.selectedDevice.key + "/playingInfo"));
                };
                //Devices count
                /* registeredNode.on('value', function(data) {
                     console.log("Registered devices node changed");
                     $scope.devicesCount = data.val().length;
                     Making sure online devices are selectable
                     Right now am making all registered devices appear in the menu for testing purposes
                     Change the registerednode back to onlinenode later on!
                     $scope.devices = data.val();

                     $scope.$apply();
                 });*/
                $scope.devices = $firebaseObject(registeredNode);
                //Make device be in control of other device
                $scope.control = function(key) {
                    $scope.inControl = true;
                    audio.volume = 0;
                    if (key === undefined) {
                        console.log("select menu");
                        $scope.selectedReadData = $firebaseObject(onlineNode.child($scope.selectedDevice.key + "/playingInfo"));
                        //Binding the chosen device to the controlling device
                        $scope.selectedReadData.$bindTo($scope, "playingInfo");

                        console.info(deviceCurrentId);

                        onlineNode.child($scope.selectedDevice.key + "/controlStatus").update({
                            receiving: true
                        });
                        /*Stop writing once the device thats being controlled goes offline so it can login later again
                        Without any errors that its already logged in*/
                        onlineNode.child($scope.selectedDevice.key).on("child_removed", function(data) {
                            console.log("Remote device just went offline");
                            $scope.selectedReadData.$destroy();
                        });
                    } else {
                        /*Simliar to the above code with they key argument instead of selectedDevice.key 
                        Just incase I want to use something else than a drop menu*/


                    }
                }

                // Fetch already rated album without the user requesting them, since they are small anyway
                
                /*this.ratingList = ratingNode.once("value").then(function(data){
                    if(data.val() !== null){
                        return data.val();
                    }
                });*/

                $scope.ratingList = $firebaseObject(ratingNode);

                this.rateAlbum = function(album, stars){
                    $scope.ratingList[album] =  stars;
                    $scope.ratingList.$save();

                    console.log("Rating album");
                }


                //Remove device to offline node
                this.logout = function() {
                    console.log("logging out");
                    onlineNode.child(deviceCurrentId).remove();
                    rootRef.unauth();
                    $scope.writeData = false;
                    $scope.readData = false;
                    $scope.ratingList = false;
                    if($scope.writeData){
                        $scope.writeData.$destroy();
                    }
                    if($scope.readData){
                        $scope.readData.$destroy();
                    }
                    if($scope.ratingList){
                        $scope.ratingList.$destroy();
                    }
                    
                    console.log(deviceCurrentId);
                }

                console.groupEnd();
                //End of user method
            };

            // Rating card
            $("#rating").mousemove(function(e) {
                var x = e.pageX - $(this).offset().left;

                for (var i = 0, step = 24; i < 5; i++, step += 38) {
                    if (x > step && x < 220) {
                        $("#rating .material-icons").eq(i).html("star");
                    } else if (x < step) {
                        $("#rating .material-icons").eq(i).html("star_border");
                    }
                }
            });

            //For stopping the countdown incase the user wants to re-rate an album
            var ratingCardTimeout;
            $scope.rate = function(star){
                $("#rating").addClass("rateToggle");
                $("#rating .material-icons").eq(5).toggleClass("expandToggle");
                user.rateAlbum($scope.albumToRate, star);
                ratingCardTimeout = setTimeout(function(){
                    $("#ratingCardWrapper").removeClass("show");
                    //Showing stars for the next time the user wants to rate
                    $scope.showStars();
                }, 3000);
            }

            $scope.showStars = function(){
                $("#rating").removeClass("rateToggle");
                $("#rating .material-icons").eq(5).toggleClass("expandToggle");
                clearTimeout(ratingCardTimeout);
            }


            $scope.showRatingCard = function(key){
                $scope.albumToRate = key;   

                if($scope.loggedIn){

                    if($scope.ratingList[key]){
                        //Resetting the stars to avoid bugs
                        fillStars(false)
                        fillStars($scope.ratingList[key]);
                    }else{
                        fillStars(false)
                    }

                    $scope.selectedAlbumName = $scope.playlist[key].name;
                    $scope.selectedAlbumArtist =  $scope.playlist[key].artist;
                    $scope.selectedAlbumArt = $scope.playlist[key].albumart;
                    $("html, body").animate({ scrollTop: $(document).height() }, "slow"); 
                    $("#ratingCardWrapper").addClass("show");
                }else{
                    toast('Please login to rate albums');
                    $("#devicesPage").click();
                }
            }
           //Programmatically filling the stars for already rated albums, a method that will be used in showRatingCard
           function fillStars(stars){
              if(!stars){
                 $("#rating .material-icons.star").html("star_border");
              }else{
                for (var i = 0; i < stars; i++) {
                    $("#rating .material-icons").eq(i).html("star");
                }
              }
              
           }

           //Loading the albums
           $scope.loadAlbum = function(){
                setTimeout(function(){
                    $(".albumCard").addClass("show");
                    $(".albumCard").removeClass("hide");
                    
                }, 500);
                setTimeout(function(){
                    // Doing it here so I have the correct position of the albums when they finish the animation (Its 700ms long)
                    
                }, 1500);                
           }

           var albmCardClickable = true;
           // Entire album acrd animation here
           $(".albumImage").click(function(){ 

            if(albmCardClickable){
                albmCardClickable = false;
                //Creating a reference because the this operator is not accessable in a setTimeout              
                var domRef = this;
                /* Changing artist and song here so there is no delay in the changing */
                 $scope.$apply(function(){
                      $scope.song = $scope.playlist[domRef.id].album[0].name;
                      $scope.artist = $scope.playlist[domRef.id].artist;
                 })
                 /*Checking if the playlist is open*/
                 if(playlistOpen){
                    animatePlaylist(false);
                 }

                /*Entering the fake animation state*/
                animateAlbumCard($(this), true);
                animateAlbumCard($(this).siblings('.info'),false);
                $(this).toggleClass('animate defaultPosition');
                $(this).siblings('.info').toggleClass('animate defaultPosition');
                $(this).siblings('.info').find(".text").addClass('animate');
                $("#fakeButton").addClass("show");
                /*Going to the real music player & removing all fake states so the album page goes to its normal state*/
                
                setTimeout(function(){
                      $("#movingContainer").removeClass('animate');
                      $("#playerPage").click();          
                      $(domRef).toggleClass('animate defaultPosition');
                      $(domRef).siblings('.info').toggleClass('animate defaultPosition');
                      $(domRef).siblings('.info').find('.text').removeClass('animate');    
                      $("#fakeButton").removeClass("show");
                      $scope.changeAlbum(domRef.id,0, true);
                  }, 1000);
                  
                 
                setTimeout(function(){
                  $("#movingContainer").addClass('animate')
                  }, 1200);

                /*Preventing album card spam*/
                setTimeout(function(){
                    albmCardClickable = true;
                }, 1500);
            }
              
           });


            /*Put in playing music here later on
            Elem: DOM reference to clicked event | this operator
            image: True or false, true if its an image so its top positioned is changed,
            Something that won't apply to the bottom sheet of the album card*/
           var animateAlbumCard = function(elem, image){
                // Storing desired position in an object just incase I want to reposition anything later on
                var reqPosition = {top:0, left:0}   
                var top = elem.position().top;
                var left = elem.position().left;
                
                // Top position change only for images
                if(image){
                    if (top !== reqPosition.top) {
                        //console.log("Changing");
                        elem.css({
                            "margin-top": -(top - reqPosition.top)
                        })
                    }
                } 
                
                // images can be 2px off the left or 178
                // If distance to the left is 2px
                if (left < reqPosition.left) {
                   elem.css({"margin-left": left - reqPosition.left })
                }
                // If distance to the left is around 178 (Could be changed)
                if (left > reqPosition.left) {
                   elem.css({"margin-left": -(left - reqPosition.left)})
                }

           };
           var playlistBtnStatus = true;
           var playlistOpen = false;

           /*Transition option to hide the playlist with a 0s transition for when
           I want to put the music player to the default state when switching albums*/
           var animatePlaylist = function(transition){
                if(!transition){
                    $("#cover").addClass('noTransition');
                    $("#imgOverlay").addClass('noTransition');
                    setTimeout(function(){
                        $("#cover").removeClass('noTransition');
                        $("#imgOverlay").removeClass('noTransition');
                    }, 1000);                    
                }
                if(playlistBtnStatus){
                    playlistBtnStatus = false;
                    $(this).children('i').toggleClass('black');
                    if(!playlistOpen){
                        playlistOpen = true;
                        $("#cover").removeClass('animate');
                        $("#imgOverlay").addClass('animate');
                        setTimeout(function(){
                            $("#cover").addClass('clip');
                        },500);
                    }else if(playlistOpen){                    
                        playlistOpen = false;
                        $("#imgOverlay").removeClass('animate');
                        $("#cover").addClass('animate');
                        $("#cover").removeClass('clip');
                    }
                    setTimeout(function(){
                        playlistBtnStatus = true;
                    }, 500);
                }
                

           }

           $("#playlistBtn").click(function(){ 
                animatePlaylist(true);
           });

           $scope.chooseSong = function(id){
                $scope.changeAudio($scope.albumIndex, id, false);
           }
        });
    }
]);

