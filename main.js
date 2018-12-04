var avatars = {}

//connecting to deepstream
var client = deepstream('wss://123.deepstreamhub.com?apiKey=4f3d4540-afe5-429e-ae68-160212e376a7')
console.log('starting');
client.login({}, function (success,data) {
	console.log("logged in", success)
	if(success){
		startApp(data)
	}else{
		console.error("deepstream Login Failed")
	}
  
})

//startup by creating a new record for each user
function startApp(data){
	var x = Math.random() * (10 - (-10)) + (-10);
	var y = 0; 
	var z = 0; 
  var initialPosition = {x: x, y: y, z: z};
  
  var myBoxColor = '#222'
  var currentUser = client.record.getRecord('user/'+ data.id);
  currentUser.whenReady(function() {
    currentUser.set({
    	type: 'a-box',
    	attr: {
    		position: initialPosition,
    		rotation: "0 0 0",
    		color: myBoxColor,
    		id: data.id,
    		depth: "1",
    		height: "1",
    		width: "1"
    	}
  })
   var camera = document.getElementById('user-cam');
    
   //update camera position 
   var networkTick = function() {
     var latestPosition = camera.getAttribute('position');
     var latestRotation = camera.getAttribute('rotation');
     currentUser.set({
       attr: {
         position: latestPosition,
         rotation: latestRotation
       }
     });
   };
  setInterval(networkTick, 100);
 })

  //deepstream's presence feature  
	client.presence.getAll(function(ids) {
		ids.forEach(subscribeToAvatarChanges)
	});
 
	client.presence.subscribe((userId, isOnline) => {
    console.log('user presence id', userId, 'online?', isOnline);
		if( isOnline ) {
      subscribeToAvatarChanges(userId)
		} else{
			removeAvatar(userId)
		}
	});  
}

//remove Avatar when user quits the app
function removeAvatar(id){
   var scene = document.getElementById('scene');
   scene.removeChild(avatars[id]);
   client.record.getRecord('user/'+id).delete();
}

//add Avatar when user enters the app
function createAvatar (id, rec) {	
	var attr = rec.get('attr')
	var type = rec.get('type')
	var newBox = document.createElement(type);
	for( var name in attr ) {
		newBox.setAttribute( name, attr[ name ] );
	}
  
  //compute and assign position values to other parts of the avatar
  //wrt the box
	var man = document.createElement('a-entity')
	man.setAttribute('mixin','man-obj')


	var x= attr.position.x;
	var y= 0;
	var z= 0;

	var manx = x+0.25
	var many = y+0.20
	var manz = z-0.6

	man.setAttribute('position', manx + " "+ many + " " + manz)
	man.setAttribute('id','man'+id)

  //wrap the whole avatar inside a single entity
  var avatarRoot = document.createElement('a-entity');
	avatarRoot.appendChild(newBox);
	avatarRoot.appendChild(man);
  
  var scene = document.getElementById('scene');
  scene.appendChild(avatarRoot);
  
  avatars[id] = avatarRoot;

	mans['man'+id] = document.getElementById('man')
	console.log("adding man ", 'man'+id)
} 

//subscribe to changes in attributes
function subscribeToAvatarChanges(id){
	var newUser = client.record.getRecord('user/'+id);
  newUser.whenReady(function() {
    newUser.subscribe('attr', (attr) => {
      if (avatarExists(id)) {
        updateAvatar(id, newUser);
      }
      else {
        createAvatar(id, newUser);	
      }
    })
	})
}

//check if avatar needs to be created or updated
function avatarExists(id) {
  return avatars.hasOwnProperty(id);
}

//update Avatar according to changing attributes
function updateAvatar(id, userRecord) {
  var avatar = avatars[id];
  var position = userRecord.get('attr.position');
  var rotation = userRecord.get('attr.rotation');
  
  avatar.setAttribute('position', position);
  avatar.setAttribute('rotation', rotation);
}
