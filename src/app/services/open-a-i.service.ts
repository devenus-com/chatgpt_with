import {Injectable} from '@angular/core';
import {CryptService} from "./crypt.service";


@Injectable({
  providedIn: 'root'
})
export class OpenAIService {

  private readonly DEFAULT_PARAMS = {
    model: "text-davinci-003",
    temperature: 0.9,
    max_tokens: 4000,
    top_p: 1.0,
    frequency_penalty: 0.5,
    presence_penalty: 0.0,
    stop: ["Human:", " AI:"],
  }

  private readonly token!:string

  constructor(private crypt:CryptService) {
    this.token = crypt.decrypt("U2FsdGVkX19Goi5uXYszH49C0uthbW/Wj0JaJxItcn0ofFytPSGIU7gIlEhK3bLHxK7ainJuPO1NYlz0hKPX9lHy5bG2/SK8fOBgKDA+jg4=");
  }

  async request(params = {}) {
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
