import { t } from './translations.js';

var app = new Vue({
  el: '#app',
  vuetify: new Vuetify(),
  'store': new Vuex.Store({
    state: {
    },
    mutations: {
    }
  }),
  data: {
    filepathInput: './test.mp4',
    filepath: '',
    filepathHistory: [],
    isYTVideo: false,
    ytPlayer: null,
    ytReady: false,
    showQuestion: false,
    questions: [],
    editQuestion: {
      id: '0',
      time: 0,
      title: '',
      image: '',
      answers: [
      ]
    },
    seekQuestionVideo: false,
    seekAnswerVideo: false,
    currentAnswer: null,
    videoSeekReset: 0,
    interactive: true,
    videoCurrentTime: -1,
    videoPaused: true,
    isVideoTimeQuestionTime: false,
    firstPlayed: false
  },
  mounted() {
    const s = localStorage.getItem('episodes');
    if (s) {
      const episodes = JSON.parse(s);
      this.filepathHistory = episodes.map((e) => e.filepath);
    }
  },
  computed: {
    answerActionTimes() {
      let answers = [{ value: '', text: '' }];
      this.questions.forEach((q) => {
        q.answers.filter(a => a.action === 'pick').forEach((a) => {
          answers.push({ value: a.id, text: a.text })
        })
      })
      return answers;
    },
    answerActionItems() {
      const a = [
        { value: 'continue', text: t('ANSWER_ACTION_CONTINUE') },
        { value: 'pick', text: t('ANSWER_ACTION_GOTO_TIME') }
      ];

      if (this.answerActionTimes.length > 0) {
        a.push({ value: 'goTo', text: t('ANSWER_ACTION_GOTO_ANSWER') });
      }
      return a;
    }
  },
  methods: {
    round(n) {
      return Math.round((n + Number.EPSILON) * 10) / 10;
    },
    init() {
      this.showQuestion = false;
      this.questions = [];
      console.log("all divs", document.querySelectorAll('div'));
      document.body.addEventListener('click', (e) => {
        // disable selecting video position
        if (e.target.type !== 'range' && !e.target.classList.contains('video-time-change-button') && !e.target.classList.contains('play-pause')) {
          if (this.seekQuestionVideo || this.seekAnswerVideo) {
            this.setPreviewImages();
          }
          this.seekAnswerVideo = false;
          this.seekQuestionVideo = false;
          this.videoSeekReset++;
          if (this.editQuestion) {
            const a = this.editQuestion.answers;
            if (a.length < 1 || (a[a.length - 1].text.length > 0 && a[a.length - 1].time > -1)) {
              this.addAnswer();
            }
          }
        }
      }, true);


      const slider = this.$refs.videoRange;
      const video = this.$refs.video;
      const _self = this;
      slider.oninput = () => {
        console.log('slider.value:', slider.value);
        this.setVideoCurrentTime(this.getVideoDuration() / 10000.0 * slider.value);
      }
      let count = 0;

      setInterval(() => {
        if (this.interactive) {
          this.isVideoTimeQuestionTime = false;
          this.questions.forEach((q) => {
            if (this.isVideoTimeQuestionTime) return;
            this.isVideoTimeQuestionTime = this.round(q.time) === this.round(this.getVideoCurrentTime());
            if (this.isVideoTimeQuestionTime) {
              if (!this.seekAnswerVideo && !this.seekQuestionVideo) {
                this.pauseVideo();
                this.videoPaused = true;
                this.editQuestion = q;
              }
            }
          });
        }

        this.videoCurrentTime = this.getVideoCurrentTime();

      }, 100);

      video.ontimeupdate = () => {
        this.setPreviewImages();
        this.firstPlayed = true;
      }

      video.onloadeddata = () => {

      }
      const s = localStorage.getItem('episodes');
      if (s) {
        const episodes = JSON.parse(s);
        const episode = episodes.find((e) => e.filepath === this.filepath);
        if (episode) {
          this.questions = episode.questions;
        }
      }
      setInterval(() => {
        const s = localStorage.getItem('episodes');
        const episodes = s ? JSON.parse(s) : [];
        let episode = episodes.find((e) => e.filepath === this.filepath);
        if (!episode) {
          episodes.push({
            filepath: this.filepath,
            questions: this.questions
          })
        } else {
          episode.questions = this.questions
        }
        localStorage.setItem('episodes', JSON.stringify(episodes));
      }, 3000);
    },
    initYT() {
      this.isYTVideo = true;
      this.ytReady = false;
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      let ytVideoiId = '';
      if (this.filepath.indexOf('/embed') > -1) {
        ytVideoiId = this.filepath.replace("https:\/\/www.youtube.com\/embed\/", "").split("?")[0];
      } else {
        ytVideoiId = this.filepath.replace("https:\/\/www.youtube.com\/watch?v=", "").split("&")[0];
      }

      window.onYouTubeIframeAPIReady = () => {
        this.ytPlayer = new YT.Player('ytPlayer', {
          videoId: ytVideoiId,
          playerVars: {
            'rel': 0, 'playsinline': 1, 'controls': 0, 'disablekb': 1, 'modestbranding': 1
          },
          events: {
            'onReady': ytOnPlayerReady,
            'onStateChange': ytOnPlayerStateChange
          }
        });
      }

      window.ytOnPlayerReady = (event) => {
        event.target.playVideo();
        ytPlayer.target = event.target;
        event.target.stopVideo();
        console.log("ytOnPlayerReady");
        this.ytReady = true;
      };


      window.ytOnPlayerStateChange = (event) => {
        console.log("ytOnPlayerStateChange", event)
        if (event.data === YT.PlayerState.ENDED) {
          ytStopVideo();
        }
        if (event.data == YT.PlayerState.PLAYING) {

        }
        console.log("ytOnPlayerStateChange:", event)
      }
    },

    loadFilepathInput() {
      this.filepath = this.filepathInput;
      this.filepathHistory.push(this.filepath);
      if (this.filepath.includes("youtube")) {
        console.log('load youtube');
        this.initYT();
      } else {
        this.$refs.video.load();
        this.$refs.video.play();
      }
      this.init();
    },
    setPreviewImages() {
      const slider = this.$refs.videoRange;
      slider.value = this.getVideoCurrentTime() / this.getVideoDuration * 10000.0;
      if (this.seekQuestionVideo) {
        this.editQuestion.image = this.getCurrentVideoImage();
        // this.editQuestion.imageSize = this.editQuestion.image.length;
        this.editQuestion.time = this.getVideoCurrentTime();
      } else if (this.seekAnswerVideo && this.currentAnswer.action === 'pick') {
        this.currentAnswer.image = this.getCurrentVideoImage();
        this.currentAnswer.time = this.getVideoCurrentTime();
      }
    },
    setVideoCurrentTime(t) {
      console.log('set current time:', t);
      if (this.isYTVideo) {
        this.ytPlayer.seekTo(t);
      } else {
        this.$refs.video.currentTime = t;
      }
    },
    getVideoCurrentTime() {
      if (this.isYTVideo) {
        return this.ytReady ? this.ytPlayer.getCurrentTime() : 0;
      }
      return this.$refs.video.currentTime;
    },
    getVideoDuration() {
      if (this.isYTVideo) {
        return this.ytReady ? this.ytPlayer.getDuration() : 0;
      }
      return this.$refs.video.duration
    },
    pauseVideo() {
      if (this.isYTVideo) {
        if (this.ytReady) {
          this.ytPlayer.pauseVideo();
        }
      } else {
        this.$refs.video.pause();
      }
    },
    addQuestion() {
      this.pauseVideo();
      this.videoPaused = true;
      this.questionKey = this.uuid();
      this.editQuestion = { id: this.uuid(), time: this.getVideoCurrentTime(), title: '', answers: [], image: 'about:blank' };
      this.questions.push(this.editQuestion);
      this.createQuestionImage();
      this.showQuestion = true;
      this.seekQuestionVideo = true;
    },
    deleteQuestion() {
      const editId = this.editQuestion.id;
      this.editQuestion = null;
      const newQuestions = [];
      for (const i in this.questions) {
        if (editId !== this.questions[i].id) {
          newQuestions.push(this.questions[i]);
        }
      }
      this.questions = newQuestions;
    },
    createQuestionImage() {
      this.editQuestion.image = this.getCurrentVideoImage();
      // this.editQuestion.imageSize = this.editQuestion.image.length;
    },
    getCurrentVideoImage() {
      if (!this.isYTVideo) {
        const video = this.$refs.video;
        const canvas = this.$refs.canvas;
        canvas.width = video.videoWidth / 5;
        canvas.height = video.videoHeight / 5;
        this.ctx = canvas.getContext('2d');
        this.ctx.drawImage(video, 0, 0, video.videoWidth / 5, video.videoHeight / 5);
        return canvas.toDataURL('image/jpeg', 0.5);
      }
      return null;
    },
    selectQuestion(question, answer = null) {
      const uuid = this.uuid();
      const store = this.$store;
      const video = this.$refs.video;
      this.seekQuestionVideo = false;
      this.seekAnswerVideo = false;
      this.questionKey = this.uuid();
      this.setVideoCurrentTime(question.time);

      setTimeout(() => {
        this.editQuestion = question;
        this.questionKey = uuid;
        this.showQuestion = true;
        this.firstPlayed = true;
      }, 100)
    },
    addAnswer() {
      this.currentAnswer = { id: this.uuid(), text: '', time: -1, image: '', action: '' }
      this.editQuestion.answers.push(this.currentAnswer);
    },
    changeAnswerAction(answer) {

      if (answer.action === 'pick') {
        // this.currentAnswer = answer; 
      } else { // auto add new answer
        answer.time = 0;
      }
    },
    uuid() {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
    },
    setQuestionTime() {
      this.seekAnswerVideo = false;
      this.seekQuestionVideo = true;
    },
    setAnswerTime(answer) {
      this.seekQuestionVideo = false;
      this.seekAnswerVideo = true;
      this.currentAnswer = answer;
    },
    togglePlay() {
      if (this.isYTVideo) {
        if (this.videoPaused) {
          ytPlayer.target.playVideo();
          ytPlayer.target.currentTime += 0.1;
          this.interactive = true;
        } else {
          ytPlayer.target.pauseVideo();
          this.interactive = false;
        }
      } else {
        const v = this.$refs.video;
        if (this.videoPaused) {
          v.currentTime += 0.1;
          v.play();
          this.interactive = true;
        } else {
          v.pause();
          this.interactive = false;
        }
        this.videoPaused = v.paused;
      }
      this.firstPlayed = true;
      
    },
    chooseAnswer(answer) {
      // TODO fade
      if (answer.action === 'pick') {
        this.setVideoCurrentTime(answer.time);
      } else if (answer.action === 'continue') {
        this.setVideoCurrentTime(this.$refs.video.currentTime + 0.1);
      } else if (answer.action === 'goTo') {
        const a = this.searchAnswerById(answer.goToId);
        this.setVideoCurrentTime(a.time + 0.1);
      }
      this.playVideo();
      this.videoPaused = false;
    },
    searchAnswerById(id) {
      let answer = null;
      this.questions.forEach((q) => {
        q.answers.forEach((a) => {
          if (a.id === id) {
            answer = a;
          }
        });
      });
      return answer;
    },
    resetStorage() {
      localStorage.removeItem('questions');
      document.location.reload();
    }
  }
});

Vue.component('question-preview', {
  template: `
  <div class="question-wrapper" v-if="question.title">
      <div>
          <div class="title" style="white-space:pre-line;">{{question.title}}</div>
          <div v-for="(a,index) in question.answers">
              <v-btn v-if="a.text.length > 0" @click="$emit('choose-answer', a)">{{a.text}}</v-btn>
          </div>
      </div>
  </div>
  `,
  props: {
    question: Object
  },
  data: () => {
    return {
      score: 0
    }
  },
  mounted() {
    console.log('question mounted', this.t);

  },
  watch: {
    question() {
      console.log('q', this.question)
    },
    t() {
      console.log('t', this.t)
    }
  }
});

Vue.component('video-seek-preview', {
  template: `
  <div @click="clickPreview" class="preview-wrapper">
      <div class="preview-image"><img :src="image"></div>
      <div v-if="showTextCaption" class="text-caption">Choose offset position in video player</div>
      <div class="time">{{ timeFormatted }}</div>
      <div v-if="showOptions" class="options"><v-btn @click="seekNewOffset()" x-small fab><v-icon class="video-time-change-button">mdi-clock</v-icon></v-btn></div>
  </div>
  `,
  props: {
    drawDefault: Boolean,
    image: String,
    time: Number,
    reset: Number
  },
  data: () => {
    return {
      showTextCaption: true,
      showOptions: false,
    }
  },
  watch: {
    image() {
      this.showTextCaption = false;
    },
    reset() {
      this.showTextCaption = false;
      this.showOptions = false;
    }
  },
  mounted() {
    if (this.drawDefault || this.image !== '') {
      this.showTextCaption = false;
    } else {
      this.seekNewOffset();
    }
  },
  computed: {
    timeFormatted() {
      let secs = (parseInt(this.time) % 60).toString();
      if (secs.length < 2) secs = '0' + secs;
      return parseInt(this.time / 60) + ':' + secs;
    }
  },
  methods: {
    clickPreview() {
      if (!this.showTextCaption) {
        this.showOptions = !this.showOptions;
        this.$emit('select')
      }
    },
    seekNewOffset() {
      this.showOptions = false;
      this.showTextCaption = true;
      this.$emit('time');
    },
    t(key) {

    }
  }
});