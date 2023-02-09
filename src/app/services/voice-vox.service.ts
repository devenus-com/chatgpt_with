import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from '../../environments/environment';
import {Observable, map, mergeMap, lastValueFrom} from "rxjs";


interface AccentPhrase {
  moras: {
    text: string;
    consonant: string;
    consonant_length: number;
    vowel: string;
    vowel_length: number;
    pitch: number;
  }[];
  accent: number;
  pause_mora: {
    text: string;
    consonant: string;
    consonant_length: number;
    vowel: string;
    vowel_length: number;
    pitch: number;
  };
  is_interrogative: boolean;
}

export interface VoiceVoxConfig {
  accent_phrases: AccentPhrase[];
  speedScale: number;
  pitchScale: number;
  intonationScale: number;
  volumeScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
  outputSamplingRate: number;
  outputStereo: boolean;
  kana: string;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceVoxService {

  constructor(private http: HttpClient) {
  }

  async createVoiceURL(config: VoiceVoxConfig, speaker: number = 2): Promise<string> {
    const url = `${environment.voiceVoxBaseURL}synthesis?speaker=${speaker}&enable_interrogative_upspeak=true`;
    const blob = await lastValueFrom<Blob>(this.http.post(url, config,{ responseType: "blob"}));
    return URL.createObjectURL(blob);
  }

  createPlayVoiceConfig(text: string, speaker: number = 2): Promise<VoiceVoxConfig> {
    const url = `${environment.voiceVoxBaseURL}audio_query?text=${text}&speaker=${speaker}`;
    const encoded = encodeURI(url);
    return lastValueFrom(this.http.post<VoiceVoxConfig>(encoded, null));
  }
}


