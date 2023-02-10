import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {SceneService} from "../../../services/scene.service";
import {OpenAIService} from "../../../services/open-a-i.service";
import {VoiceVoxService} from "../../../services/voice-vox.service";
import {CryptService} from "../../../services/crypt.service";
import {TalkService} from "../../../services/talk.service";
import {waitForAsync} from "@angular/core/testing";


@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements AfterViewInit, OnInit {

  constructor(private scene: SceneService, private ai: OpenAIService, private vv: VoiceVoxService, private talk: TalkService) {
  }

  private recognizer?: any

  ngOnInit(): void {
    this.scene.onMouseDownEvent.subscribe(x => {
      this.prepareRecognition();
      this.recognizer.start();
    });
    this.scene.onMouseUpEvent.subscribe(x => this.recognizer?.stop());
  }

  @ViewChild("audioElement")
  private audioElement!: ElementRef<HTMLAudioElement>

  prepareRecognition() {
    // @ts-ignore
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognizer = new Recognition();
    this.recognizer.lang = 'ja-JP';
    this.recognizer.interimResults = false;
    this.recognizer.continuous = true;
    // @ts-ignore
    this.recognizer.onresult = async (e) => {
      const results = e.results;
      const resultText = results[results.length - 1][0].transcript.trim();
      console.log(resultText);
      try {
        const aiResult = await this.ai.request({prompt: resultText});
        console.log(aiResult);
        const [src, promises] = await this.talk.talk(aiResult);
        this.audioElement.nativeElement.src = src;
        await Promise.all([this.audioElement.nativeElement.play(), this.mouseMove(promises)]);
      } catch (e) {
        await this.talk.talk("エラーがでました。");
      }
    }
    this.recognizer.onerror = () => {
      this.prepareRecognition();
    }
  }

  private loaded = false;

  async ngAfterViewInit(): Promise<void> {
    this.canvas.nativeElement.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    this.canvas.nativeElement.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    await this.scene.initialize(this.canvas.nativeElement, window.innerWidth, this.canvas.nativeElement.height);
    await this.scene.createObjects();
    this.animate();
    this.loaded = true;
    this.audioElement.nativeElement.autoplay = false;
    const [src, promises] = await this.talk.talk("私をクリックしながら喋りかけてくださいね");
    this.audioElement.nativeElement.src = src;
    setTimeout(async () =>
        await Promise.all([this.audioElement.nativeElement.play(), this.mouseMove(promises)])
      , 5000);
  }

  async mouseMove(promises: (() => Promise<void>)[]): Promise<void> {
    for (const p of promises) {
      await p().catch(e => console.log(e));
    }
  }

  @ViewChild('threeCanvas') canvas!: ElementRef<HTMLCanvasElement>

  private animate() {
    this.scene.render();
    requestAnimationFrame(() => this.animate());
  }

  @HostListener("window:resize", ['$event'])
  async onResize(evnet: any) {
    this.canvas.nativeElement.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    this.canvas.nativeElement.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    this.scene.onResize(window.innerWidth, window.innerHeight);
  }
}
