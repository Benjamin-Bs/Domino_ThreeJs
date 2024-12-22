declare module "three/webgpu" {
    import { WebGLRenderer } from "three";
    export class WebGPURenderer extends WebGLRenderer { }
    export type Renderer = WebGPURenderer | WebGLRenderer;
}
