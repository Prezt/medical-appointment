import { ChatOpenAI } from "@langchain/openai";
import { config, type ModelConfig } from "../config";

export class OpenRouterService{
    private config: ModelConfig
    private llmClient: ChatOpenAI
    constructor(configOverride?: ModelConfig) {
        this.config = configOverride ?? config;

        this.llmClient = new ChatOpenAI({
            apiKey: this.config.apiKey,
            modelName: this.config.models.at(0),
            temperature: this.config.temperature,
            configuration: {
                baseURL: 'https://openrouter.ai/api/v1',
                defaultHeaders:{
                    'HTTP-Referer': this.config.httpReferer,
                    'X-Title': this.config.xTitle
                }
            },

            // config for smartModels
            modelKwargs: {
                models: this.config.models,
                provider: this.config.provider
            }
        })
    }

    async generateStructured() {}
}