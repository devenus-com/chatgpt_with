import {EventEmitter, Injectable} from '@angular/core';
import * as THREE from 'three';
import {AnimationMixer, Clock, Mesh, MeshStandardMaterial, PlaneGeometry, SkinnedMesh, TextureLoader} from 'three';
import {MMDLoader} from "three/examples/jsm/loaders/MMDLoader";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {MMDAnimationHelper} from "three/examples/jsm/animation/MMDAnimationHelper";
import {Font, FontLoader} from "three/examples/jsm/loaders/FontLoader";
import {randInt} from "three/src/math/MathUtils";
import {TextGeometry} from "three/examples/jsm/geometries/TextGeometry";
import {chunk, join} from 'lodash'
import {VoiceVoxConfig} from "./voice-vox.service";

@Injectable({
  providedIn: 'root'
})
export class SceneService {

  scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private aspectRate!: number;
  private mmdLoader!: MMDLoader;
  private mmdHelper!: MMDAnimationHelper;
  model!: SkinnedMesh;
  private clock!: Clock;
  private textureLoader!: TextureLoader;
  private controls!: OrbitControls;

  // object
  private fukidashiMesh!: Mesh;
  private font!: Font;

  constructor() {
    this.mmdLoader = new MMDLoader();
    this.mmdHelper = new MMDAnimationHelper();
    this.textureLoader = new TextureLoader();
    this.scene = new THREE.Scene();
    this.clock = new Clock();
    this.render = this.render.bind(this);
  }

  render() {
    this.animation();
    this.renderer.render(this.scene, this.camera);
  }

  onMouseDownEvent = new EventEmitter<string>();
  onMouseUpEvent = new EventEmitter<string>();

  onResize(width: number, height: number) {
    // レンダラーのサイズを調整する
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);

    // カメラのアスペクト比を正す
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  async initialize(canvas: HTMLCanvasElement, width: number, height: number) {
    canvas.width = width;
    canvas.height = height;
    this.aspectRate = canvas.clientWidth !== 0 ? canvas.clientWidth / canvas.clientHeight : 0;
    this.scene.background = new THREE.Color(1, 1, 1);
    this.createCamera(width, height);
    this.createRenderer(canvas, width, height);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    // not show the shorts.
    this.controls.maxAzimuthAngle = Math.PI / 4;
    this.controls.minAzimuthAngle = -(Math.PI / 4);
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1
    this.controls.minPolarAngle = 0.5;
    this.controls.target.set(0, 10, 0)
    this.font = await new FontLoader().loadAsync("assets/fonts/Zen_Maru_Gothic_Regular.json");

    canvas.addEventListener('mousedown', e => {
      const objs = this.getMouseObjects(e);
      if (objs.find(x => x.object.name === "model")) {
        this.onMouseDownEvent.emit('on');
      }
    });
    canvas.addEventListener('mouseup', e => {
      this.onMouseUpEvent.emit('off');
    });
    canvas.addEventListener("touchstart", e => {
      const objs = this.getMouseObjects(e);
      if (objs.find(x => x.object.name === "model")) {
        this.onMouseDownEvent.emit('on');
      }
    })
    canvas.addEventListener("touchend", e => {
      this.onMouseUpEvent.emit('off');
    })
  }

  private getMouseObjects(e: any) {
    const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    const pos = new THREE.Vector3(mouseX, mouseY, 1);
    pos.unproject(this.camera);
    const ray = new THREE.Raycaster(this.camera.position, pos.sub(this.camera.position).normalize());
    return ray.intersectObjects(this.scene.children);
  }

  async createObjects() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const light = new THREE.SpotLight(0xFFFFFF, 0.2);
    light.castShadow = true;
    light.position.set(0, 40, 0);
    this.scene.add(light);

    // const gridHelper = new THREE.GridHelper(400, 20);
    // this.scene.add(gridHelper);

    await Promise.all([this.createMMD(), this.createRoom(), this.createBed()])
    this.fukidashiMesh = await this.createPlate("/assets/plate/output.png");
    this.fukidashiMesh.position.set(-6, 21, 2);
    //this.scene.add(this.fukidashiMesh);
    //this.talk("私をクリックしながら喋りかけてくださいね。");
    this.createCopyrightNotice();
  }

  async talk(talk:string, config?: VoiceVoxConfig) {
    if (!talk){
      // 7番が口止め
      this.model.morphTargetInfluences![7] = 0;
      return;
    }
    talk.replace('\n', "");
    // 描画最大が８０文字
    const viewTalk = chunk(talk, 60);
    const viewSplitTalk = chunk(join(viewTalk[0], ""), 15);
    const viewTalkString = join(viewSplitTalk.map(x => join(x, "")), "\n");
    const textGeometry = new TextGeometry(viewTalkString, {
      font: this.font,
      size: 0.5,
      height: 0.1,
      curveSegments: 12,
    })
    textGeometry.center()
    const textMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000
    })
    const text = new THREE.Mesh(textGeometry, textMaterial);
    text.castShadow = false;
    text.position.set(0, 1.0, 0);
    text.rotateZ(-Math.PI / 75);
    const cansel = setInterval(() =>
      this.model.morphTargetInfluences![7] = Number(!this.model.morphTargetInfluences![7]), 240
    );
    this.fukidashiMesh.add(text);
    this.scene.add(this.fukidashiMesh);
    for (let i = 0; i < viewTalk.length; i++) {
      await new Promise(resolve => setTimeout(async () => {
        this.fukidashiMesh.remove(text);
        this.scene.remove(this.fukidashiMesh);
        const next = talk.replace(join(viewTalk[0], ""), "");
        clearInterval(cansel);
        await this.talk(next);
      }, 6000))
    }
  }

  toggleMouse() {
    this.model.morphTargetInfluences![6] = Number(!this.model.morphTargetInfluences![6]);
  }

  private async createMMD() {
    this.model = await this.mmdLoader.loadAsync(
      "assets/model/tsugumi/model/Tsumugi_sEihuku.pmx"
    );
    this.model.name = 'model';
    this.model.castShadow = true;
    //this.model.receiveShadow = true;
    this.mmdLoader.loadVPD("assets/poses/sit2.vpd", false, (pose) => {
      this.mmdHelper.pose(this.model, pose, {resetPose: true, ik: true, grant: true});
      this.scene.add(this.model);
    })
    this.model.scale.set(1.1, 1.1, 1.1);
    this.model.position.set(0, 0, 2.5);
    console.log(this.model);
    this.model.morphTargetInfluences![0] = 1;
  }

  private async createRoom() {
    const room = await this.mmdLoader.loadAsync("assets/room/private.pmx");
    room.name = 'room';
    room.receiveShadow = true;
    room.position.set(0, 0, 40)
    this.scene.add(room);
  }

  private async createBed() {
    const bed = await this.mmdLoader.loadAsync("assets/bed/bed.pmx");
    bed.name = 'room';
    bed.castShadow = true;
    bed.receiveShadow = true;
    bed.position.set(0, 0, -9.5)
    bed.scale.set(1.6, 1.6, 1.6)
    this.scene.add(bed);
  }

  private createCopyrightNotice() {
    const copyright =
      "春日部つむぎモデル\n" +
      "https://3d.nicovideo.jp/works/td84779\n" +
      "\n" +
      "ベッドモデル制作：\n" +
      "ニコID：1525589/Twitter：紅郎@d962\n" +
      "\n" +
      "私室製作：\n" +
      "@kemilia1010 (Twitter)\n" +
      "\n" +
      "PG製作\n" +
      "(C)DEVenus .ltd @m96-chan"

    const textGeometry = new TextGeometry(copyright, {
      font: this.font,
      size: 0.4,
      height: 0.1,
      curveSegments: 12,
    })
    const textMaterial = new THREE.MeshStandardMaterial({
      color: 0xE0D0F0
    })
    const text = new THREE.Mesh(textGeometry, textMaterial);
    text.position.set(-9, 17, -16)
    text.rotateX(-Math.PI / 4)
    this.scene.add(text);
  }

  private createCamera(width: number, height: number) {
    const target = this.scene.getObjectByName('camera');
    if (target !== undefined) {
      this.scene.remove(this.camera);
    }
    this.camera = new THREE.PerspectiveCamera(
      70, this.aspectRate, 0.1, 1000,
    );
    this.camera.position.set(0, 25, 25);
    this.camera.lookAt(0, 10, 0)
    this.camera.name = "camera";
  }

  private createRenderer(canvas: HTMLCanvasElement, width: number, height: number) {
    this.renderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      canvas: canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
  }

  private frame: number = 0
  private nextWink = randInt(60, 900);
  private breath = true;

  private animation() {
    this.frame++;
    // this.mixer?.update(this.clock.getDelta());
    this.fukidashiMesh.lookAt(this.camera.position);
    // ６７は首
    this.model.skeleton.bones[67].lookAt(this.camera.position);

    if (!(this.frame % this.nextWink)) {
      setTimeout(() => {
        this.model.morphTargetInfluences![15] = 1
        setTimeout(() => {
          this.model.morphTargetInfluences![15] = 0
          this.nextWink = randInt(60, 900);
        }, 60)
      }, 60)
    }
    if (!(this.frame % 180)) {
      this.breath = !this.breath;
    }
    let add = this.breath ? 1 : -1;

    // 22 45 右肩　左肩
    this.model.skeleton.bones[22].position.y += 0.002 * add;
    this.model.skeleton.bones[45].position.y += 0.002 * add;
  }

  private async createPlate(path: string) {
    const map = await this.textureLoader.loadAsync(path);
    return new Mesh(
      new PlaneGeometry(16, 10.5,),
      new MeshStandardMaterial({
        transparent: true,
        map: map
      }))
  }
}
