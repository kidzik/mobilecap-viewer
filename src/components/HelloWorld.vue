<template>
  <v-container fluid>
    <v-row class="text-center">
    <v-col
      cols="2"
    >
      <v-row align="center">
        <v-col>
          <img v-bind:src="qrcode()" style="width: 100%;" />
          <div v-if="state=='processing' || state=='uploading'" style="padding: 1em">
            <v-progress-circular
              indeterminate
              :size="50"
              :width="7"
              color="amber"
            />
          </div>
          <div>client {{ state }} | server {{ server_state }}</div>
          <div>Session {{ session_id }}</div>
          <div style="margin-top: 1em;">
            <label for="subject_id">Subject ID</label>
            <input v-model="subject_id" id="subject_id"/>
          </div>
          <div>
            <label for="subject_mass">Mass (kg)</label>
            <input v-model="subject_mass" id="subject_mass"/>
          </div>
          <div>
            <label for="subject_height">Height (m)</label>
            <input v-model="subject_height" id="subject_height"/>
          </div>
          <div>
            <label for="subject_gender">Gender </label>
            <select v-model="subject_gender" id="subject_gender">
              <option value="m">male</option>
              <option value="f">female</option>
            </select>  
          </div>
          <div style="margin-top: 1em;">
            <label for="cb_square">Square size (mm)</label>
            <input v-model="cb_square" id="cb_square"/>
          </div>
          <div>
            <label for="cb_rows"># of rows</label>
            <input v-model="cb_rows" id="cb_rows"/>
          </div>
          <div>
            <label for="cb_cols"># of cols</label>
            <input v-model="cb_cols" id="cb_cols"/>
          </div>
          <div>
            <label for="cb_placement">Placement</label>
            <select v-model="cb_placement" id="cb_placement">
              <option value="backWall">Back wall</option>
              <option value="ground">Ground</option>
            </select>
          </div>
          <div style="margin-top: 1em;">
            <label for="trial_name">Trial name</label>
            <input v-model="trial_name" id="trial_name"/>
          </div>
          <v-btn block @click="changeState" style="margin-top: 1em;" ref="btnSessionCtrl">{{ statusButtonLabel() }}</v-btn>
          <v-btn block @click="downloadTrc" style="margin-top: 1em">OpenSim (.trc)</v-btn>
          <div style="margin-top: 1em;">
            <v-text-field v-model="trial_url" v-if="trial" readonly label="Link to this trial" />
            <v-text-field v-model="trial_details_url" v-if="trial" readonly label="Link to trial details data"/>
          </div>
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
    <div id="videos" v-if="trial && state == 'ready'">
      <video v-for="vid in trial.videos"
      v-bind:key="vid.id" autoplay="true"
      muted :id="vid.id" :src="vid.video_thumb"
      controls="true" crossorigin="anonymous"/>
    </div>
    </v-col>
    </v-row>
  </v-container>
</template>

<script>
import * as THREE from 'three'
import * as THREE_OC from '@/orbitControls'
import axios from 'axios'
//  console.log(frames)
/*
0Nose
1Neck
2RShoulder
3RElbow
4RWrist
5LShoulder
6LElbow
7LWrist
8midHip
9RHip
10RKnee
11RAnkle
12LHip
13LKnee
14LAnkle
15REye
16LEye
17REar
18LEar
19LBigToe
20LSmallToe
21LHeel
22RBigToe
23RSmallToe
24RHeel
25C7_study			r_shoulder_study			L_shoulder_study			r.ASIS_study			L.ASIS_study			r.PSIS_study			L.PSIS_study			r_knee_study			L_knee_study			r_mknee_study			L_mknee_study			r_ankle_study			L_ankle_study			r_mankle_study			L_mankle_study			r_calc_study			L_calc_study			r_toe_study			L_toe_study			r_5meta_study			L_5meta_study
*/
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
      server_state: "ready",
      heartbeat: null,
      status_url: "/",
      bose_bones: null,
      trial: null,
      frames: [],
      synced: false,
      trial_name: null,
      subject_id: null,
      subject_mass: null,
      subject_height: null,
      subject_gender: null,
      cb_square: 60,
      cb_cols: 11,
      cb_rows: 8,
      cb_placement: "backWall",
    }
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.onResize)
  },
  computed: {
    trial_url: function(){
      if (this.trial!=null){
        return location.protocol+"//"+location.host+"/trial/"+this.trial.id+"/"
      }
      return ""
    },
    session_id: function(){
      if (this.ssesion)
        return this.session.id
      return ""
    },
    trial_details_url: function(){
      if (this.trial!=null){
        return axios.defaults.baseURL+"trials/"+this.trial.id+"/"
      }
      return ""
    }
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
      "processing": "Cancel trial",
      }
      return maps[this.state]
    },
    loadResults: function(trial_url){
      axios.get(trial_url)
        .then(response => {
          console.log(response)
          this.synced = false
          this.trial = response.data
          // load JSON
          let json_file = response.data.results[0].json
          console.log(json_file)
          return axios.get(json_file)
        })
        .then(response => {
          console.log(response)
          this.frames = response.data
          // add videos

          this.show3d()
          this.animate();

          this.state = "ready"
        })
    },
    init: function() {
      axios.get('/sessions/new/')
        .then(response => (
          this.session = response.data[0]
        ))
    },
    setup3d: function(){
      let container = document.getElementById('mocap');
      let ratio = container.clientWidth/container.clientHeight
      this.camera = new THREE.PerspectiveCamera(50, ratio, 0.1, 100);
      this.camera.position.z = -10;
      this.camera.position.y = -10;

      this.scene = new THREE.Scene();
      this.renderer = new THREE.WebGLRenderer({antialias: true});
      this.onResize();
      container.appendChild(this.renderer.domElement);
      this.controls = new THREE_OC.OrbitControls( this.camera, this.renderer.domElement );
    },
    show3d: function(){
      let container = document.getElementById('mocap');

      let lengths = openpose_bones.map((item) => {
        let from = item[0]
        let to = item[1]
        let cframe = 100

        var vfrom = new THREE.Vector3(this.frames[cframe][2+from*3],
          this.frames[cframe][2 + from*3 + 1],
          this.frames[cframe][2 + from*3 + 2]);

        var vto = new THREE.Vector3(this.frames[cframe][2+to*3],
          this.frames[cframe][2 + to*3 + 1],
          this.frames[cframe][2 + to*3 + 2]);
        return vto.distanceTo(vfrom)
      })
      console.log(lengths)

      this.pose_spheres = []
      this.pose_bones = []
      this.frame = 0

      while(this.scene.children.length > 0){
        this.scene.remove(this.scene.children[0]);
      }

      let material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
      lengths.forEach((item) => {
        let cone_geometry = new THREE.ConeGeometry( 0.05, item*2.5, 32 );
        let cone = new THREE.Mesh( cone_geometry, material )
        this.pose_bones.push(cone);
        this.scene.add( cone );
      })
    },
    syncVideos: function() {
      if (this.synced || this.trial == null || this.trial.videos.length == 0)
        return
      let self = this;
      let vid0 = document.getElementById(this.trial.videos[0].id)
      console.log(this.trial.videos[0])
      vid0.addEventListener('ended', function () {
        console.count('loop restart');
        self.trial.videos.forEach((video) => {
          let vid_element = document.getElementById(video.id);
          vid_element.currentTime = 0;
          vid_element.play();
        })
      });
      this.trial.videos.forEach((video) => {
        let vid_element = document.getElementById(video.id);
        vid_element.playbackRate = 1
      })
      this.synced = true
    },
    onResize: function() {
      let container = document.getElementById('mocap');
      this.renderer.setSize(container.clientWidth-4, window.innerHeight*0.8);
    },
    checkStatus: function(){
      axios.get(this.status_url).then(response => {
        console.log(response.data.status)
        this.server_state = response.data.status
        if (response.data.status=="ready"){
          this.loadResults(response.data.trial)
          console.log("DISPLAY RESULTS!")
        }
        if (response.data.status=="processing"){
          axios.get(response.data.trial)
            .then(response => {
              console.log(response)
              this.trial = response.data
            })
          console.log("DISPLAY TRIAL LINKS!")
        }
        if (response.data.status=="processing" || response.data.status=="uploading"){
          setTimeout(this.checkStatus, 1000);
        }
      })
    },
    downloadTrc: function(){
      if (this.trial != null && this.trial.results.length > 0){
        window.open(this.trial.results[0].trc,"_blank")
      }
    },
    changeState: function(){
    if (this.state == "ready"){
      this.state = "recording"

      axios.get('/sessions/' + this.session.id + '/record/?name='+this.trial_name)
    }
    else if (this.state == "recording"){
      this.state = "processing"

      var params_str = [
            "subject_id="+this.subject_id,
            "subject_mass="+this.subject_mass,
            "subject_height="+this.subject_height,
            "subject_gender="+this.subject_gender,
            "cb_square="+this.cb_square,
            "cb_rows="+this.cb_rows,
            "cb_cols="+this.cb_cols,
            "cb_placement="+this.cb_placement,
      ].join("&")
      
      axios.get('/sessions/' + this.session.id + '/stop/?name='+this.trial_name+'&'+params_str)
      this.status_url = '/sessions/' + this.session.id + '/status/'
      setTimeout(this.checkStatus, 1000);
    }
    else if (this.state == "processing"){
      this.state = "ready"
//      axios.get('/sessions/' + this.session.id + '/stop/')
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
      this.trial.videos.forEach((video) => {
        let vid_element = document.getElementById(video.id);
        vid_element.currentTime = time
      })
    },
    animate: function() {
      if (this.trial == null){
        return
      }
        requestAnimationFrame(this.animate);
        let vid0 = document.getElementById(this.trial.videos[0].id);
        if (vid0 == null || vid0 == undefined){
          return
        }

        let cframe = (Math.floor(vid0.currentTime*30)) % this.frames.length


        for (let i = 0; i < this.pose_bones.length; i++) {
          let from = openpose_bones[i][0]
          let to = openpose_bones[i][1]

          var vfrom = new THREE.Vector3(this.frames[cframe][2 + from*3],
            this.frames[cframe][2 + from*3 + 1],
            this.frames[cframe][2 + from*3 + 2]);

          var vto = new THREE.Vector3(this.frames[cframe][2 + to*3],
            this.frames[cframe][2 + to*3 + 1],
            this.frames[cframe][2 + to*3 + 2]);

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
        this.syncVideos();
    }
  },
  mounted: function() {
      this.init();
      this.setup3d()

      if (this.$route.params.trial_id != null){
        let trial_id = this.$route.params.trial_id
        this.loadResults("/trials/" + trial_id + "/")
        console.log(trial_id)
      }

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
  input, option, select {
      border: 1px #ffffff solid;
      color: #ffffff;
      margin: 0.1em 0.5em;
      width: 5em;
  }
  option {
      background-color: #000000;
  }
  
</style>
