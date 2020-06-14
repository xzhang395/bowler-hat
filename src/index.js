import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './style.css';

function main() {
    let mixer, dt, lastframe = Date.now(), aniMode = 1, playtime, frametime, logtime = true, mixerOg, actionO;
    let apple, speedA = 0, gravity = -0.05, startApple = false;
    let pigeon, actionP, speedP = 0.2, startPigeon = false, pigeonStartz;
    let head, startHead = false;
    let ogeyes, OG, startOG = false, actionE;
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
    controls.target.set(0, 5, 0);
    controls.update();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#444C59');

    {
        const planeSize = 40;

        const loader = new THREE.TextureLoader();
        const texture = loader.load('https://threejsfundamentals.org/threejs/resources/images/checker.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = planeSize / 2;
        texture.repeat.set(repeats, repeats);

        const planeGeo = new THREE.PlaneBufferGeometry(planeSize, planeSize);
        const planeMat = new THREE.MeshPhongMaterial({
            map: texture,
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
            head = root.getObjectByName('manhead');
            pigeonStartz = -renderer.domElement.clientWidth / 2 / 3 / 25;
            pigeon.position.z = pigeonStartz;
            console.log(dumpObject(root).join('\n'));
            console.log(pigeon.position.z);


            // compute the box that contains all the stuff
            // from root and below
            const box = new THREE.Box3().setFromObject(root);

            const boxSize = 15;
            const boxCenter = new THREE.Vector3(0, 2.5, 0);

            // set the camera to frame the box
            frameArea(boxSize * 0.5, boxSize, boxCenter, camera);

            // update the Trackball controls to handle the new size
            controls.maxDistance = boxSize * 1.5;
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
            console.log(dumpObject(rootog).join('\n'));

            // compute the box that contains all the stuff
            // from root and below
            const box = new THREE.Box3().setFromObject(rootog);

            const boxSize = 15;
            const boxCenter = new THREE.Vector3(0, 2.5, 0);

            // set the camera to frame the box
            frameArea(boxSize * 0.5, boxSize, boxCenter, camera);

            // update the Trackball controls to handle the new size
            controls.maxDistance = boxSize * 1.5;
            controls.target.copy(boxCenter);
            controls.update();
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
            startApple = true;
            startPigeon = true;
        }
        if (aniMode == 2) {
            startHead = true;
            startPigeon = true;
        }
        if (aniMode == 3) {
            startHead = true;
        }
    }, false);

    function render() {

        dt = (Date.now() - lastframe) / 1000;
        if (mixer) {
            mixer.update(dt);
        }
        if (mixerOg) {
            mixerOg.update(dt);
            // console.log(ogeyes.scale.z);

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
            }

        }
        if (startPigeon == true) {
            if (aniMode == 2) {
                actionP.paused = false;
                if (pigeon.position.z < -pigeonStartz) {
                    pigeon.position.z = pigeon.position.z + speedP;
                }
                else {
                    actionP.paused = true;
                    aniMode = 3;
                }
            }
            if (aniMode == 1) {

                if (pigeon.position.z < -0.026839667931199074) {
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
                    head.position.z = head.position.z + speedP;
                }
                else { startHead = false; }
            }
            if (aniMode == 3) {
                if (head.position.z > 0.1) {
                    head.position.z = head.position.z - 0.2;
                }
                else {
                    head.position.y = head.position.y - 0.5;
                    const rate = 0.2;
                    head.scale.x = head.scale.x - rate;
                    head.scale.y = head.scale.y - rate;
                    head.scale.z = head.scale.z - rate;
                    if(head.position.y<0){
                        startHead = false;
                        startOG = true;
                    }
                }
            }
        }
        if (startOG == true) {
            actionO.play();
            actionE.play();
        }

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

}

main();
