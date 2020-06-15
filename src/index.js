import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './style.css';

function main() {
    const boxSize = 8,boxCenter =  new THREE.Vector3(0, 4, 0);
    let mixer, dt, lastframe = Date.now(), aniMode = 1, playtime, frametime, logtime = true, mixerOg, actionO, reset = false,modethree = false;
    let apple, speedA = 0, gravity = -0.05, startApple = false,AstartP;
    let pigeon, actionP, speedP = 0.1, startPigeon = false, pigeonStartz;
    let head, startHead = false;
    let ogeyes, OG, startOG = false, actionE, OstartP;
    let hat, HDstartP;
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.5;

    const fov = 60;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(50, 20, 0);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 1, 0);
    controls.maxPolarAngle = Math.PI/1.8; 
    resetView();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#7E7CBB');

    {
        const planeSize = 8000;
        const planeGeo = new THREE.PlaneBufferGeometry(30, planeSize);
        const planeMat = new THREE.MeshPhongMaterial({
            color:'#6DC6E7',
            // map: texture,
            side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.rotation.x = Math.PI * -.5;
        scene.add(mesh);
    }

    const color = 0x444C59;
    const intensity = 2;
    const light = new THREE.AmbientLight(color, intensity);
    scene.add(light);

    {
        const color = 0xFFFFFF;
        const intensity = 1.5;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(19, 25, 23);
        scene.add(light);
        scene.add(light.target);
    }

    function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
        const halfSizeToFitOnScreen = sizeToFitOnScreen * 1.1;
        const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
        const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
        // compute a unit vector that points in the direction the camera is now
        // in the xz plane from the center of the box
        const direction = (new THREE.Vector3())
            .subVectors(camera.position, boxCenter)
            .multiply(new THREE.Vector3(1, 0.35, 1))
            .normalize();

        // move the camera to a position distance units way from the center
        // in whatever direction the camera was from the center already
        camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

        // pick some near and far values for the frustum that
        // will contain the box.
        camera.near = boxSize / 100;
        camera.far = boxSize * 100;

        camera.updateProjectionMatrix();

        // point the camera to look at the center of the box
        camera.lookAt(0, 0, boxCenter.z);
    }
    {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load('./bowler-hat.glb', (gltf) => {
            const root = gltf.scene;
            mixer = new THREE.AnimationMixer(gltf.scene);
            actionP = mixer.clipAction(gltf.animations[0]);
            scene.add(root);
            apple = root.getObjectByName('apple');
            pigeon = root.getObjectByName('pigeon');
            pigeon.visible = false;
            head = root.getObjectByName('manhead');
            hat = root.getObjectByName('hat');
            pigeonStartz = -renderer.domElement.clientWidth / 2 / 3 / 25;
            pigeon.position.z = pigeonStartz;
            // console.log(dumpObject(root).join('\n'));
            AstartP = apple.position.y;
            HDstartP = hat.position.y;
            // compute the box that contains all the stuff
            // from root and below
            const box = new THREE.Box3().setFromObject(root);

            // set the camera to frame the box
            frameArea(boxSize, boxSize,boxCenter, camera);

            // update the Trackball controls to handle the new size
            controls.maxDistance = 10 * 1.5;
            controls.target.copy(boxCenter);
            controls.update();

        });
        gltfLoader.load('./og.glb', (gltf) => {
            const rootog = gltf.scene;
            mixerOg = new THREE.AnimationMixer(rootog);
            actionO = mixerOg.clipAction(gltf.animations[0]);
            actionO.setLoop(THREE.LoopOnce);
            actionO.clampWhenFinished = true;
            actionE = mixerOg.clipAction(gltf.animations[1]);

            scene.add(rootog);
            OG = rootog.getObjectByName('OG');
            ogeyes = rootog.getObjectByName('ogeyes');
            ogeyes.position.set(2.3996, 0, -0.25);
            OG.add(ogeyes);
            ogeyes.rotation.x = Math.PI * 2;
            // console.log(dumpObject(rootog).join('\n'));
            OstartP = OG.position.y;

        });
    }

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth * 3;
        const height = canvas.clientHeight * 3;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }


    function dumpObject(obj, lines = [], isLast = true, prefix = '') {
        const localPrefix = isLast ? '└─' : '├─';
        lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
        const newPrefix = prefix + (isLast ? '  ' : '│ ');
        const lastNdx = obj.children.length - 1;
        obj.children.forEach((child, ndx) => {
            const isLast = ndx === lastNdx;
            dumpObject(child, lines, isLast, newPrefix);
        });
        return lines;
    }

    document.addEventListener('click', function (event) {
        // If the clicked element doesn't have the right selector, bail
        if (!event.target.matches('.bttn-next')) return;

        // Don't follow the link
        event.preventDefault();
        if (aniMode == 1) {
            resetView();
            logtime =true;
            actionP.reset();
            speedA = 0;
            pigeon.position.z = pigeonStartz;
            startApple = true;
            startPigeon = true;
        }
        if (aniMode == 2) { 
            resetView();     
            startHead = true;
            startPigeon = true;
        }
        if (aniMode == 3) {
            resetView();
            startHead = true;
            modethree = true;
        }
        if (aniMode == 4) {
            resetView();
            reset = true;
        }
    }, false);

    function resetView(){
        controls.reset(); 
        frameArea(boxSize, boxSize,boxCenter, camera);
        controls.target.copy(boxCenter);
        controls.update();
    }
    function render() {
        dt = (Date.now() - lastframe) / 1000;
        if (mixer) {
            mixer.update(dt);
        }
        if (mixerOg) {
            mixerOg.update(dt);

        }
        lastframe = Date.now();


        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        if (startApple == true) {

            if (apple.position.y > -4) {
                apple.position.y = apple.position.y + speedA;
                speedA = speedA + gravity;
            }
            else {
                startApple = false;
                apple.visible = false;
            }

        }
        if (startPigeon == true) {
            pigeon.visible = true;
            if (aniMode == 2) {
                actionP.paused = false;
                if (pigeon.position.z < -pigeonStartz) {
                    pigeon.position.z = pigeon.position.z + speedP;
                }
                else {
                    actionP.paused = true;
                    
                    pigeon.visible = false;
                    startPigeon = false;
                    aniMode = 3;
                }
            }
            if (aniMode == 1) {
                pigeon.visible=true;
                if (pigeon.position.z < -0.026839667931199074) {
                    actionP.paused = false;
                    actionP.play();
                    if (logtime) { playtime = Date.now(); logtime = false; }
                    pigeon.position.z = pigeon.position.z + speedP;
                }
                else {
                    frametime = (Date.now() - playtime) / 1000;
                    if (Math.abs(frametime - Math.round(frametime)) < 0.01) {
                        aniMode = 2;
                        startPigeon = false;
                        actionP.paused = true;
                    }
                }
            }

        }
        if (startHead == true) {
            if (aniMode == 2) {
                if (head.position.z < 3.5) {
                    head.position.z = head.position.z + 0.1;
                }
                else { startHead = false; 
                    
                    }
            }
            if (modethree) {
                if (head.position.z > 0.1) {
                    head.position.z = head.position.z - 0.2;
                }
                else {
                    head.position.z = 0;
                    head.position.y = head.position.y - 0.5;
                    const rate = 0.2;
                    head.scale.x = head.scale.x - rate;
                    head.scale.y = head.scale.y - rate;
                    head.scale.z = head.scale.z - rate;
                    hat.position.y = hat.position.y - 0.5;
                    hat.scale.x = hat.scale.x - rate;
                    hat.scale.y = hat.scale.y - rate;
                    hat.scale.z = hat.scale.z - rate;
                    if (hat.position.y < 0) {
                        setTimeout(() => {
                            startHead = false;
                            startOG = true;
                            head.visible = false;
                            hat.visible = false;
                            modethree = false;
                        }, 50);

                    }
                }
            }
        }
        if (startOG == true) {
            OG.visible = true;
            actionO.reset();
            actionE.reset();
            actionO.play();
            actionE.play();
            aniMode = 4;
            startOG = false;
        }
        if (reset) {
            aniMode = 1;
            if (OG.scale.x > 0) {
                const rate = 0.2;
                OG.scale.x = OG.scale.x - rate;
                OG.scale.y = OG.scale.y - rate;
                OG.scale.z = OG.scale.z - rate;
            }
            else{
                OG.scale.x = 0;
                OG.scale.y = 0;
                OG.scale.z = 0;
                OG.visible = false;
                startOG = false;
                head.visible = true;
                hat.visible = true;
                if(hat.position.y<HDstartP){
                    const rate = 0.2;
                    head.scale.x = head.scale.x + rate;
                    head.scale.y = head.scale.y + rate;
                    head.scale.z = head.scale.z + rate;
                    hat.position.y = hat.position.y + 0.5;
                    hat.scale.x = hat.scale.x + rate;
                    hat.scale.y = hat.scale.y + rate;
                    hat.scale.z = hat.scale.z + rate;
                    head.position.y = head.position.y + 0.5;
                    speedA = 0;
                    apple.position.y = 10;
                }
                else{
                    apple.visible = true;
                    if (apple.position.y > AstartP) {
                        apple.position.y = apple.position.y + speedA;
                        speedA = speedA + gravity;
                    }else{
                        apple.position.y = AstartP;
                        
                        reset = false;
                    }
                }
            }

        }

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

}

main();
