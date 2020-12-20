<template>
  <v-container fluid>
    <v-row class="text-center">
    <v-col
      cols="2"
    >
      <v-row align="center">
        <v-col>
          <img v-bind:src="qrcode()" style="width: 100%;" />
          <v-btn block @click="changeState" style="margin-top: 1em;" ref="btnSessionCtrl">{{ statusButtonLabel() }}</v-btn>
          <v-btn block style="margin-top: 1em" onclick="window.open('melissa1.trc')">OpenSim (.trc)</v-btn>
        </v-col>
      </v-row>
    </v-col>
    <v-col
      cols="8"
    >
      <div id="mocap" />
      <div>
        Use mouse to control the 3D view.
      </div>
    </v-col>
    <v-col
      cols="2"
    >
    <div id="videos">
      <video autoplay="true" muted id="video1" src="https://mobilecap.s3-us-west-2.amazonaws.com/videos/left1.mp4" controls="true" crossorigin="anonymous"/>
      <video autoplay="true" muted id="video2" src="https://mobilecap.s3-us-west-2.amazonaws.com/videos/rear1.mp4" controls="true" crossorigin="anonymous"/>
      <video autoplay="true" muted id="video3" src="https://mobilecap.s3-us-west-2.amazonaws.com/videos/right1.mp4" controls="true" crossorigin="anonymous"/>
    </div>
    </v-col>
    </v-row>
  </v-container>
</template>

<script>
import * as THREE from 'three'
import * as data from '@/data'
import * as THREE_OC from '@/orbitControls'
import axios from 'axios'
//  console.log(frames)

let openpose_bones = [
//    [0,15],
//    [0,16],
//    [17,15],
//    [18,16],
    [0,1],
    [1,2],
    [1,5],
    [1,8],
    [8,9],
    [8,12],
    [9,10],
    [10,11],
    [12,13],
    [11,22],
    [13,14],
    [14,19],
    [5,6],
    [6,7],
    [2,3],
    [3,4],
//    [24,11],
//    [22,23],
//    [14,21],
//    [20,19],
]

let lengths = openpose_bones.map((item) => {
  let from = item[0]
  let to = item[1]
  let cframe = 100

  var vfrom = new THREE.Vector3(data.frames[cframe][from*3],
    data.frames[cframe][from*3 + 1],
    data.frames[cframe][from*3 + 2]);

  var vto = new THREE.Vector3(data.frames[cframe][to*3],
    data.frames[cframe][to*3 + 1],
    data.frames[cframe][to*3 + 2]);
  return vto.distanceTo(vfrom)
})
console.log(lengths)

export default {
  name: 'HelloWorld',
  data() {
    return {
      camera: null,
      scene: null,
      renderer: null,
      mesh: null,
      processor: null,
      session: null,
      state: "ready",
    }
  },
  beforeDestroy: function () {
  window.removeEventListener('resize', this.onResize)
  },
  methods: {
    qrcode: function() {
      if (this.session)
        return this.session.qrcode
      return null
    },
    statusButtonLabel: function(){
      var maps = {
      "ready": "Start recording",
      "recording": "Stop recording",
      }
      return maps[this.state]
    },
    init: function() {

      axios.get('/sessions/new/')
        .then(response => (
          this.session = response.data[0]
        ))

        let container = document.getElementById('mocap');

        let ratio = container.clientWidth/container.clientHeight
        this.camera = new THREE.PerspectiveCamera(50, ratio, 0.1, 100);
        this.camera.position.z = -10;
        this.camera.position.y = -10;

        this.scene = new THREE.Scene();

        let material = new THREE.MeshBasicMaterial( {color: 0xffff00} );

        this.pose_spheres = []
        this.pose_bones = []
        this.frame = 0

/*        for (let i = 0; i < 1; i++) {
          let geometry = new THREE.SphereGeometry( 0.2, 32, 32 );
          let sphere = new THREE.Mesh( geometry, material )
          this.pose_spheres.push(sphere);
          this.scene.add( sphere );
        }*/


        lengths.forEach((item) => {
          let cone_geometry = new THREE.ConeGeometry( 0.05, item*2.5, 32 );
          let cone = new THREE.Mesh( cone_geometry, material )
          this.pose_bones.push(cone);
          this.scene.add( cone );
        })



        this.renderer = new THREE.WebGLRenderer({antialias: true});
//        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.onResize();
        container.appendChild(this.renderer.domElement);
        this.controls = new THREE_OC.OrbitControls( this.camera, this.renderer.domElement );

        this.video1 = document.getElementById("video1");
        this.video2 = document.getElementById("video2");
        this.video3 = document.getElementById("video3");

        let self = this;
        this.video1.addEventListener('ended', function () {
          console.count('loop restart');
          self.video1.currentTime = 0;
          self.video2.currentTime = 0;
          self.video3.currentTime = 0;
          self.video1.play();
          self.video2.play();
          self.video3.play();
        })

        this.video1.playbackRate = 1
        this.video2.playbackRate = 1
        this.video3.playbackRate = 1

    },
    onResize: function() {
    let container = document.getElementById('mocap');
    this.renderer.setSize(container.clientWidth-4, window.innerHeight*0.8);
    },
    changeState: function(){
    if (this.state == "ready"){
      this.label = "Stop recording";
      this.state = "recording"
      axios.get('/sessions/' + this.session.id + '/record/')
    }
    else if (this.state == "recording"){
      this.$refs.btnSessionCtrl.innerText = "Start recording";
      this.state = "ready"
      axios.get('/sessions/' + this.session.id + '/stop/')
    }
    },
    timerCallback: function() {
      this.computeFrame();
      let self = this;
      setTimeout(function () {
          self.timerCallback();
        }, 0);
    },

    computeFrame: function() {
    },

    goToTime: function(time) {
      if (this.video1 !== undefined && this.video2 !== undefined && this.video3 !== undefined){
        this.video2.currentTime = time;
        this.video3.currentTime = time;
        this.video1.currentTime = time;
      }
      let x = time
      time = x
    },
    animate: function() {
        requestAnimationFrame(this.animate);
        let cframe = (Math.floor(self.video1.currentTime*120)) % data.frames.length


        for (let i = 0; i < this.pose_bones.length; i++) {
          let from = openpose_bones[i][0]
          let to = openpose_bones[i][1]

          var vfrom = new THREE.Vector3(data.frames[cframe][from*3],
            data.frames[cframe][from*3 + 1],
            data.frames[cframe][from*3 + 2]);

          var vto = new THREE.Vector3(data.frames[cframe][to*3],
            data.frames[cframe][to*3 + 1],
            data.frames[cframe][to*3 + 2]);

          var axis = new THREE.Vector3(0, 1, 0);
          this.pose_bones[i].quaternion.setFromUnitVectors(
            axis,
            vto.clone().add(vfrom.clone().multiplyScalar(-1)).normalize()
          );
          let midpoint = vto.clone().add(vfrom.clone());
          this.pose_bones[i].position.copy(midpoint);

          if (openpose_bones[i][0] == 0){
//            this.pose_spheres[0].position.copy(vfrom);
          }

        }
        this.renderer.render(this.scene, this.camera);
    }
  },
  mounted() {
      this.init();
      this.animate();
      console.log('here')
      window.addEventListener('resize', this.onResize)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  #mocap {
    border: 2px solid #222222;
    width: 100%;
    height: 100%;
    margin: 0 auto;
  }
  #videos {
  }
  #videos video {
    width: 100%;
  }
  #cameras canvas {
    padding: 5px;
    padding-top: 10px;
  }
  #videos video {
    padding: 5px;
    padding-top: 10px;
  }
</style>
