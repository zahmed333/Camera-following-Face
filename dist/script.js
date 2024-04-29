var scaleFactor = 0.01; // Adjust this value based on your scene setup

(function(window) {
	
	function Fly(camera, onReady) {
    this.onReady = onReady;
		this.mouseX = 0;
		this.mouseY = 0;
		this.camera = camera;
		this.trail = [];
		this.trailLength = 10; // Adjust the trail length as needed
		this.trailOpacity = 1;
		this.trailFadeSpeed = 0.03; // Adjust the fade speed as needed
    
		this.el = new THREE.Group();
		this.el.position.z = 10;
		Utils.loadOBJ('https://s3-us-west-2.amazonaws.com/s.cdpn.io/356608/butterfly.obj', null, function(object) {
			object.traverse(function(child) {
				if (child.type === 'Mesh') {
          child.material = new THREE.MeshPhongMaterial({color: 0xd45f00, side: THREE.DoubleSide});
				}
			});
			
			this.body = object;
			this.body.scale.set(4, 4, 4)
			this.el.add(this.body);
			
			var wingLeft = this.el.getObjectByName('Wing_Left');
			var wingRight = this.el.getObjectByName('Wing_Right');
			
			// Animation
			TweenMax.to(this.body.position, 0.5, {y: 0.5, yoyo: true, repeat: -1, ease: Quad.easeInOut});
			TweenMax.to(wingLeft.rotation, 0.1, {z: Utils.toRad(-85), repeat: -1, yoyo: true, ease: Linear.easeNone});
			TweenMax.to(wingRight.rotation, 0.1, {z: Utils.toRad(85), repeat: -1, yoyo: true, ease: Linear.easeNone});
      
      this.onReady();
		}.bind(this));
		
		document.addEventListener('mousemove', this.onMouseMove.bind(this));
	}
	
	Fly.prototype.onMouseMove = function(e) {
		this.mouseX = e.clientX;
		this.mouseY = e.clientY;
		this.moveTo(this.mouseX, this.mouseY);
	}
	Fly.prototype.updateTrail = function() {
		if (!this.lastTrailUpdate || Date.now() - this.lastTrailUpdate > 500) {
			// Convert the fly's 3D position to 2D screen coordinates
			var screenPosition = this.el.position.clone().project(camera);
			var screenX = (screenPosition.x + 1) / 2 * window.innerWidth;
			var screenY = -(screenPosition.y - 1) / 2 * window.innerHeight;
	
			// Check if the fly has moved since the last trail update
			if (!this.lastScreenPosition || screenX !== this.lastScreenPosition.x || screenY !== this.lastScreenPosition.y) {
				// Generate random data
				const randomData = Math.random();
				let data = "";
				if (randomData < 0.33) {
					const ssn = Math.floor(Math.random() * 1000000000).toString().padStart(9, "0");
					data = "SSN: " + ssn.replace(/(\d{3})(\d{2})(\d{4})/, "$1-$2-$3");
				} else if (randomData < 0.66) {
					const gateId = Math.floor(Math.random() * 1000000000).toString().padStart(9, "0");
					data = "Gate ID: " + gateId.replace(/(\d{3})(\d{3})(\d{3})/, "$1-$2-$3");
				} else {
					data = "Data Worth: $" + Math.floor(Math.random() * 100);
				}
	
				// Create a new trail element with glitch aesthetic
				const trailEl = document.createElement("div");
				trailEl.className = "trail";
				trailEl.innerHTML = data.split("").map(char => `<span class="glitch">${char}</span>`).join("");
				trailEl.style.position = "absolute";
				trailEl.style.left = screenX + "px";
				trailEl.style.top = screenY + "px";
				trailEl.style.opacity = 1; // Set initial opacity to 1
				document.body.appendChild(trailEl);
	
				// Add the trail element to the trail array
				this.trail.push({ element: trailEl, timestamp: Date.now() });
	
				// Remove old trail elements if the trail length is exceeded or if 8 seconds have passed
				while (this.trail.length > this.trailLength || (this.trail.length > 0 && Date.now() - this.trail[0].timestamp > 8000)) {
					const { element } = this.trail.shift();
					document.body.removeChild(element);
				}
			}
	
			// Update the opacity of the trail elements gradually
			this.trail.forEach((trailEl, index) => {
				const opacity = 1 - (index / this.trailLength);
				trailEl.element.style.opacity = opacity;
			});
	
			// Update the last screen position
			this.lastScreenPosition = { x: screenX, y: screenY };
	
			this.lastTrailUpdate = Date.now();
		}
	};

	Fly.prototype.moveTo = function(x, y) {
		var vec3 = Utils.unproject2DCoords(x, y, this.camera, this.el.position.z);
		TweenLite.to(this.el.position, 0.3, {x: vec3.x, y: vec3.y, ease: Linear.easeNone});
	}
	
	window.Fly = Fly;
	
})(window);


(function(window) {
  
	function Watcher(camera, onReady) {
    this.onReady = onReady;
		this.camera = camera;
		this.mouseX = 0;
		this.mouseY = 0;
		this.walkerY = 0;
		this.walkerX = 0;
		this.loaded = false;
		
		var self = this;
		
		this.el = new THREE.Object3D();
		var scale = 1.2;
		this.el.scale.set(scale, scale, scale);
		
		setTimeout(function() {
			var vec3 = Utils.unproject2DCoords(window.innerWidth / 3, window.innerHeight / 3, camera, 5);
			this.el.position.set(vec3.x, vec3.y, 5);
		}.bind(this), 0)

		
		// Load OBJ File with Materials
		Utils.loadOBJ('https://s3-us-west-2.amazonaws.com/s.cdpn.io/356608/cam.obj', 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/356608/cam.mtl', function(object) {
			var body = new THREE.Object3D(),
					base = new THREE.Object3D(),
					pivot = new THREE.Object3D();
			
			// Apply shadows
			object.traverse( function(child) {
				if ( child instanceof THREE.Mesh ) {
	        child.castShadow = true;
	        child.receiveShadow = true;
		    }
			})
			
      var glass = object.getObjectByName('Glass');
      glass.material = new THREE.MeshPhongMaterial({color: 'black', shininess: 300, reflectivity: 10, opacity: 0.7});
      glass.material.transparent = true;
      
			// Separate parts of the camera into groups
			body.add(object.getObjectByName('lens_body'));
      body.add(object.getObjectByName('Glass'));
			body.add(object.getObjectByName('cam_body'));
			body.add(object.getObjectByName('rotate_node02'));
			body.add(object.getObjectByName('lens01'));
			body.add(object.getObjectByName('rain_cover'));
			base.add(object.getObjectByName('cam_base'));
			pivot.add(object.getObjectByName('Rotate_node_Z'));
			
			self.body = body;
			self.base = base;
			self.pivot = pivot;
			
			self.el.add(body);
			self.el.add(base);
			self.el.add(pivot);
			
			self.loaded = true;
			self.onReady();
		});
		
		document.addEventListener('mousemove', this.onMouseMove.bind(this));
	}
  
  Watcher.prototype.onMouseMove = function(e) {
    this.mouseX = e.clientX;
		this.mouseY = e.clientY;
  
    var vec3 = Utils.unproject2DCoords(this.mouseX, this.mouseY, this.camera, 10).sub(new THREE.Vector3(this.el.position.x - 2, this.el.position.y + 2, 0));
		TweenMax.rotateTo(this.body, 0.1, {vector: vec3, ease: Linear.easeNone, delay: 0.2});
  }

	window.Watcher = Watcher;
})(window);


var wW,
		wH,
		canvas3d,
		canvas2d,
		scene,
		camera,
		renderer,
		watcher,
		lights = [],
		plane,
		fly,
    numObjectsLoaded = 0;
		
	function setupCamera() {
		const video = document.createElement('video');
		video.id = 'video';
		video.autoplay = true;
		video.muted = true;
		document.body.appendChild(video);
	
		function resizeVideo() {
			const aspectRatio = 16 / 9; // Set this to the aspect ratio of your camera feed
			const height = window.innerHeight;
			const width = height * aspectRatio;
			video.width = width;
			video.height = height;
		}
	
		resizeVideo(); // Initial resize
		window.addEventListener('resize', resizeVideo); // Adjust video size on window resize
	
		navigator.mediaDevices.getUserMedia({ video: true })
			.then(function(stream) {
				video.srcObject = stream;
				video.onplay = () => {
					console.log('Video is playing, starting face detection.');
					initializeFaceDetection(video);
				};
			})
			.catch(function(error) {
				console.error("Cannot access the camera", error);
			});
	}	
	

	  function initializeFaceDetection(video) {
		const faceDetector = ml5.faceApi(video, {
			withLandmarks: true,
			withExpressions: false,
			withDescriptors: false
		}, modelReady);
		
		function modelReady() {
			console.log('Model ready!');
			faceDetector.detect(gotResults);
		}
		function gotResults(err, results) {
			if (err) {
				console.error(err);
				return;
			}
			if (results) {
				results.forEach(result => {
					const { _x, _y, _width, _height } = result.alignedRect._box;
		
					// Flip the X coordinate if the video feed is mirrored.
					const flippedX = video.offsetWidth - (_x + _width); 
		
					moveFlyAndWatcherToFace(flippedX, _y, _width, _height);
				});
				faceDetector.detect(gotResults);
			}
		}
		
				
		
	}

	let detectionMesh = null; // This will store our detection mesh

	function updateThreeJSDetection(x, y, width, height) {
		if (!detectionMesh) {
			let geometry = new THREE.BoxGeometry(1, 1, 0.1); // Default size, we'll scale it later
			let material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
			detectionMesh = new THREE.Mesh(geometry, material);
			scene.add(detectionMesh);
		}
		
		detectionMesh.scale.set(width * scaleFactor, height * scaleFactor, 1);
		detectionMesh.position.set((x + width / 2) * scaleFactor, -(y + height / 2) * scaleFactor, 0);
	}
	

	function interactWithFace(x, y, width, height) {
		let targetPosition = new THREE.Vector3((x + width / 2) * scaleFactor, -(y + height / 2) * scaleFactor, 0);
		let object = scene.getObjectByName("interactiveObject");
		if (object) {
			TweenMax.to(object.position, 1, { x: targetPosition.x, y: targetPosition.y, ease: Expo.easeOut });
		}
	}
	
	function moveFlyAndWatcherToFace(detectedX, detectedY) {
		const rect = video.getBoundingClientRect(); // 'video' is your video element
		const scaleX = window.innerWidth / rect.width;
		const scaleY = window.innerHeight / rect.height;
		
		// Scale the detected coordinates to match the full window size
		const screenX = detectedX * scaleX + rect.left;
		const screenY = detectedY * scaleY + rect.top;
	
		// Use the mouse movement approach with the converted coordinates for the fly
		var vec3Fly = Utils.unproject2DCoords(screenX, screenY, camera, fly.el.position.z);
		TweenLite.to(fly.el.position, 0.3, { x: vec3Fly.x, y: vec3Fly.y, ease: Linear.easeNone });

		fly.updateTrail();
	
		// Rotate the watcher to face the detected face
		var vec3Watcher = Utils.unproject2DCoords(screenX, screenY, camera, 10).sub(new THREE.Vector3(watcher.el.position.x - 2, watcher.el.position.y + 2, 0));
		TweenMax.rotateTo(watcher.body, 0.1, {vector: vec3Watcher, ease: Linear.easeNone, delay: 0.2});
	}
	
	

function init() {
	setupCamera(); // Initialize the camera first

	canvas3d = document.getElementById('canvas3d');
	setSize();
  $('#intro').css('opacity', '1');
  
	// Set up 3D Canvas
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(40, wW / wH, 0.1, 1000);
	camera.position.z = 30;
	camera.lookAt(scene.position);
	renderer = new THREE.WebGLRenderer({
    canvas: canvas3d,
    antialias: true,
    alpha: true
  });
	renderer.setSize(wW, wH);
	renderer.shadowMap.enabled = true;
	
  watcher = new Watcher(camera, checkReady);
	scene.add(watcher.el);
  
	var light = new THREE.SpotLight(0xffffff, 1.2, 0, Math.PI / 4, 1);  // Slightly increased intensity
	var vec3 = Utils.unproject2DCoords(window.innerWidth / 3, window.innerHeight / 3, camera, 5);
	light.position.set(vec3.x + 10, vec3.y + 20, 25);
	light.castShadow = true;
	light.shadow.mapSize.width = 4096;
	light.shadow.mapSize.height = 4096;
	light.shadow.camera.near = 1;
	light.shadow.camera.far = 200;
	light.shadow.camera.fov = 30; // Narrower field of view for more focused light
	scene.add(light);
	
	var light2 = new THREE.AmbientLight(0xffffff, 0.2); // Increased intensity to lighten the scene
	scene.add(light2);
	
	var planeG = new THREE.PlaneGeometry(500, 500, 50);
	var planeMat = new THREE.MeshPhongMaterial({
	  color: 0x000080,
	  side: THREE.DoubleSide,
	  specular: 0x999999, // More reflective
	  shininess: 10      // Increased shininess
	});
	plane = new THREE.Mesh(planeG, planeMat);
	plane.receiveShadow = true;
	scene.add(plane);
	

	fly = new Fly(camera, checkReady);
	scene.add(fly.el);
	
	light.lookAt(watcher.el.position);
	
	render();
}

function setSize() {
	wW = window.innerWidth;
	wH = window.innerHeight;

  $('#intro').css({
    left: (wW / 2) - ($('#intro').width() / 2),
    top: (wH / 2) - ($('#intro').height() / 2)
  })
  
	canvas3d.style.width = wW + 'px';
  canvas3d.style.height = wH + 'px';
}

function checkReady() {
  numObjectsLoaded++;
  console.log(numObjectsLoaded)
  if (numObjectsLoaded >= 2) {
    TweenLite.to('#intro, #bg', 1, {opacity: 0});
  }
}

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

$(document).ready(init);