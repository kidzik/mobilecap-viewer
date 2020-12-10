<template>
  <div id="container"></div>
</template>

<script>
import * as THREE from 'three'
import * as data from '@/data'
import * as THREE_OC from '@/orbitControls'
//  console.log(frames)

export default {
  name: 'HelloWorld',
  data() {
    return {
      camera: null,
      scene: null,
      renderer: null,
      mesh: null,
    }
  },
  methods: {
    init: function() {
        let container = document.getElementById('container');

        this.camera = new THREE.PerspectiveCamera(70, container.clientWidth/container.clientHeight, 0.01, 10);
        this.camera.position.z = 1;

        this.scene = new THREE.Scene();

        let geometry = new THREE.SphereGeometry( 0.005, 32, 32 );
        let material = new THREE.MeshBasicMaterial( {color: 0xffff00} );

        this.pose_spheres = []
        this.pose_bones = []
        this.frame = 0

        for (let i = 0; i < 25; i++) {
          let sphere = new THREE.Mesh( geometry, material )
          this.pose_spheres.push(sphere);
          this.scene.add( sphere );
        }

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);
        this.controls = new THREE_OC.OrbitControls( this.camera, this.renderer.domElement );

    },
    animate: function() {
        requestAnimationFrame(this.animate);

        for (let i = 0; i < 25; i++) {
          this.pose_spheres[i].position.set(
            data.frames[this.frame][i*3]/10,
            data.frames[this.frame][i*3+1]/10,
            data.frames[this.frame][i*3+2]/10
          );
        }

        this.frame = (this.frame + 1) % 400
//        this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }
  },
  mounted() {
      this.init();
      this.animate();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  #container {
    height: 800px;
    width: 100%;
  }
</style>
