import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {SceneService} from "../../../services/scene.service";
import {OpenAIService} from "../../../services/open-a-i.service";
import {CryptService} from "../../../services/crypt.service";


@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements AfterViewInit, OnInit {

  constructor(private scene: SceneService, private ai: OpenAIService) {

  }

  private recognizer?: any

  ngOnInit(): void {
    this.scene.onMouseDownEvent.subscribe(x => {
      this.prepareRecognition();
      this.recognizer.start();
    });
    this.scene.onMouseUpEvent.subscribe(x => this.recognizer?.stop());
  }

  prepareRecognition() {
    // @ts-ignore
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognizer = new Recognition();
    this.recognizer.lang = 'ja-JP';
    this.recognizer.interimResults = false;
    this.recognizer.continuous = true;
    // @ts-ignore
    this.recognizer.onresult = (e) => {
      const results = e.results;
      const resultText = results[results.length - 1][0].transcript.trim();
      console.log(resultText);
      this.ai.request({prompt: resultText}).then(async (t) => {
        console.log(t);
        await this.scene.talk(t);
      });
    }
    this.recognizer.onerror = () => {
      this.prepareRecognition()
    }
  }

  async ngAfterViewInit(): Promise<void> {
    this.canvas.nativeElement.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    this.canvas.nativeElement.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    await this.scene.initialize(this.canvas.nativeElement, window.innerWidth, this.canvas.nativeElement.height);
    await this.scene.createObjects();
    this.animate();
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
