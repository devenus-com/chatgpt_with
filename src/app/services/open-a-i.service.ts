import {Injectable} from '@angular/core';


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

  constructor() {
  }

  async request(params = {}) {
    const params_ = {...this.DEFAULT_PARAMS, ...params};
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + String("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")
      },
      body: JSON.stringify(params_)
    }
    const response = await fetch('https://api.openai.com/v1/completions', requestOptions);
    const data = await response.json();
    return data.choices[0].text;
  }
}
