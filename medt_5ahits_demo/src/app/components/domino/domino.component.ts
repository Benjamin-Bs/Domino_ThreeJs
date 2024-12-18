import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import Ammo from 'ammo.js';

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



  constructor() { }

  ngOnInit() {

  }

  ngAfterViewInit(): void {
    Ammo().then((AmmoLib: any) => {
      this.initPhysics(AmmoLib);
      this.initScene();
      this.animate();
    });
  }

  private initScene(): void {
    this.scene = new Scene;
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

    this.renderer = new WebGLRenderer({ canvas: this.canvas.nativeElement, antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;


  }

  animate() {

  }


  initPhysics(Ammo: any) {

  }

}
