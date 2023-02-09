import {Injectable} from '@angular/core';
import {SceneService} from "./scene.service";
import {VoiceVoxService} from "./voice-vox.service";

@Injectable({
  providedIn: 'root'
})
export class TalkService {

  constructor(private scene: SceneService, private vv: VoiceVoxService) {
  }

  // 喋りのモーフィアス
  private faceMorph: any = {
    default: 32,
    a: 7,
    i: 8,
    u: 10,
    e: 11,
    o: 12,
  }

  public async talk(sentence: string): Promise<[string,  (() => Promise<void>)[]]> {
    //console.log(sentence);
    const config = await this.vv.createPlayVoiceConfig(sentence);
    const morass:any[] = config.accent_phrases.flatMap(x => x.moras);
    const promises = [];
    for (const x of morass) {
      promises.push(() => new Promise<void>(resolve => {
        const index = this.faceMorph[x.vowel.toLowerCase()] ? this.faceMorph[x.vowel.toLowerCase()] : 1;
        this.scene.model.morphTargetInfluences![index] = 1;
        setTimeout(() => {
          this.scene.model.morphTargetInfluences![index] = 0;
          resolve();
        }, Math.ceil((x.consonant_length + x.vowel_length) * 1050));
      }));
    }
    return [await this.vv.createVoiceURL(config), promises];
  }


}
