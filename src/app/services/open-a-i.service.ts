import {Injectable} from '@angular/core';
import {CryptService} from "./crypt.service";


@Injectable({
  providedIn: 'root'
})
export class OpenAIService {

  private readonly DEFAULT_PARAMS = {
    model: "text-davinci-003",
    temperature: 0.5,
    max_tokens: 4000,
    top_p: 1.0,
    frequency_penalty: 0.5,
    presence_penalty: 0.0,
    stop: ["You:"],
  }

  private readonly token!:string

  constructor(private crypt:CryptService) {
    this.token = crypt.decrypt("U2FsdGVkX19Fi9i1J5ZJz/8P4Nz+oK04OTjfJgRZpWBVGzz/Dt/22ZYLndxBhVyhbCr1PicB8/kCGlXmcm3r7IdCXzimjbd6cYMX/eWAscQ=");
  }

  async request(params = {}) {
    console.log("ai request start...")
    const params_ = {...this.DEFAULT_PARAMS, ...params};
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + String(this.token)
      },
      body: JSON.stringify(params_)
    }
    const response = await fetch('https://api.openai.com/v1/completions', requestOptions);
    const data = await response.json();
    return data.choices[0].text;
  }
}
