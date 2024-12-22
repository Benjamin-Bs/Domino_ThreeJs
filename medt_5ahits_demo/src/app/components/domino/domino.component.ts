import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { PerspectiveCamera, Scene, WebGLRenderer, Mesh, BoxGeometry, AmbientLight, DirectionalLight, MeshStandardMaterial } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as CANNON from 'cannon-es';
// import Ammo from 'ammo.js';
// import { GLTFLoader } from 'three-stdlib';


@Component({
  selector: 'app-domino',
  templateUrl: './domino.component.html',
  styleUrls: ['./domino.component.scss'],
})
export class DominoComponent implements OnInit, AfterViewInit {

  @ViewChild('domino') canvas!: ElementRef<HTMLCanvasElement>;

  scene!: Scene;
  camera!: PerspectiveCamera;
  renderer!: WebGLRenderer;
  world!: CANNON.World;
  rigidBodies: any[] = [];
  shadowCube!: Mesh;


  constructor() { }

  ngOnInit() { }

  ngAfterViewInit(): void {
    this.initPhysics();
    this.initScene();
    this.loadModel();
  }

  private initScene(): void {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new WebGLRenderer({ canvas: this.canvas.nativeElement, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    // Licht hinzufügen
    const light = new AmbientLight(0xffffff, 1); // Ambient light
    this.scene.add(light);

    const shadowGeometry = new BoxGeometry(1, 1, 1,);
    const shadowMaterial = new MeshStandardMaterial({
      color: 0xffffff
    });

    this.shadowCube = new Mesh(shadowGeometry, shadowMaterial);
    this.scene.add(this.shadowCube);

    this.shadowCube.position.set(1, 10, 1);

    // Shadow cube lighting
    this.shadowCube.castShadow = true;


    const directionalLight = new DirectionalLight(0xffffff, 1);  // Spotlight
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Animation Loop
    this.renderer.setAnimationLoop(() => {
      this.animate();
    });

  }

  animate() {
    this.world.step(1 / 60);  // Physik-Update mit einer festen Schrittweite

    this.rigidBodies.forEach(({ mesh, body }) => {
      if (mesh && body) {  // Überprüfe, ob 'mesh' und 'body' definiert sind
        if (body.position) {
          mesh.position.copy(body.position);  // Position synchronisieren
        }
        if (body.rotation) {
          mesh.rotation.setFromQuaternion(body.rotation);  // Rotation synchronisieren
        }
      }
    });

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate.bind(this));
  }


  initPhysics() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.8, 0);  // Schwerkraft

    // Physik-Materialien und -Eigenschaften
    const material = new CANNON.Material();
    const contactMaterial = new CANNON.ContactMaterial(material, material, {
      friction: 0.4,
      restitution: 0.3,
    });
    this.world.addContactMaterial(contactMaterial);

    // Boden hinzufügen
    this.addGround();
  }

  addGround() {
    const groundShape = new CANNON.Plane(); // Boden als plane
    const groundBody = new CANNON.Body({
      mass: 0,  // Boden ist statisch
      position: new CANNON.Vec3(0, -1, 0),
      material: new CANNON.Material(),
    });
    groundBody.addShape(groundShape);
    this.world.addBody(groundBody);
  }

  loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      'assets/Blender/domino.gltf',
      (gltf) => {
        const domino = gltf.scene;
        domino.traverse((child) => {
          if (child instanceof Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        domino.position.set(0, 2, 0);
        this.scene.add(domino);
        this.addPhysicsToModel(domino);  // Physik hinzufügen
        this.camera.position.set(0, 3, 5);  // Kamera positionieren
        this.camera.lookAt(domino.position); // Kamera ausrichten
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );
  }

  addPhysicsToModel(domino: any) {
    const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 0.2));
    const body = new CANNON.Body({
      mass: 1,  // Masse des Domino
      position: new CANNON.Vec3(domino.position.x, domino.position.y, domino.position.z),
      material: new CANNON.Material(),
    });
    body.addShape(shape);

    domino.userData = { body };  // Speichere den Körper im userData des Modells
    this.world.addBody(body);

    // Speichern des Mesh und des Körpers in einer Liste, um sie zu aktualisieren
    this.rigidBodies.push({ mesh: domino, body });  // Achte darauf, dass beide korrekt gespeichert werden
  }

}
