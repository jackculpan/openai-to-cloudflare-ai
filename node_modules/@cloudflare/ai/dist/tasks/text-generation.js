import { Tensor, TensorType } from "../tensor";
import { generateTgTemplate } from "../templates";
export class AiTextGeneration {
    constructor(inputs, modelSettings) {
        this.schema = {
            input: {
                type: "object",
                oneOf: [
                    {
                        properties: {
                            prompt: {
                                type: "string",
                                maxLength: 4096,
                            },
                            raw: {
                                type: "boolean",
                                default: false,
                            },
                            stream: {
                                type: "boolean",
                                default: false,
                            },
                            max_tokens: {
                                type: "integer",
                                default: 256,
                            },
                        },
                        required: ["prompt"],
                    },
                    {
                        properties: {
                            messages: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        role: {
                                            type: "string",
                                        },
                                        content: {
                                            type: "string",
                                            maxLength: 4096,
                                        },
                                    },
                                    required: ["role", "content"],
                                },
                            },
                            stream: {
                                type: "boolean",
                                default: false,
                            },
                            max_tokens: {
                                type: "integer",
                                default: 256,
                            },
                        },
                        required: ["messages"],
                    },
                ],
            },
            output: {
                oneOf: [
                    {
                        type: "object",
                        contentType: "application/json",
                        properties: {
                            response: {
                                type: "string",
                            },
                        },
                    },
                    {
                        type: "string",
                        contentType: "text/event-stream",
                        format: "binary",
                    },
                ],
            },
        };
        this.inputs = inputs;
        this.modelSettings = modelSettings;
    }
    preProcessing() {
        if (this.inputs.stream && this.modelSettings.inputsDefaultsStream) {
            this.inputs = { ...this.modelSettings.inputsDefaultsStream, ...this.inputs };
        }
        else if (this.modelSettings.inputsDefaults) {
            this.inputs = { ...this.modelSettings.inputsDefaults, ...this.inputs };
        }
        let prompt = "";
        if (this.inputs.messages === undefined) {
            if (this.inputs.raw == true) {
                prompt = this.inputs.prompt;
            }
            else {
                prompt = generateTgTemplate([
                    { role: "system", content: false },
                    { role: "user", content: this.inputs.prompt },
                ], this.modelSettings.preProcessingArgs.promptTemplate);
            }
        }
        else {
            prompt = generateTgTemplate(this.inputs.messages, this.modelSettings.preProcessingArgs.promptTemplate);
        }
        this.preProcessedInputs = prompt;
    }
    generateTensors() {
        this.tensors = [
            new Tensor(TensorType.String, [this.preProcessedInputs], {
                shape: [1],
                name: "INPUT_0",
            }),
            new Tensor(TensorType.Uint32, [this.inputs.max_tokens], {
                shape: [1],
                name: "INPUT_1",
            }),
        ];
    }
    postProcessing(response) {
        if (this.modelSettings.postProcessingFunc) {
            this.postProcessedOutputs = { response: this.modelSettings.postProcessingFunc(response) };
        }
        else {
            this.postProcessedOutputs = { response: response.name.value[0] };
        }
    }
    postProcessingStream(response) {
        if (this.modelSettings.postProcessingFuncStream) {
            return { response: this.modelSettings.postProcessingFuncStream(response) };
        }
        else {
            return { response: response.name.value[0] };
        }
    }
}
