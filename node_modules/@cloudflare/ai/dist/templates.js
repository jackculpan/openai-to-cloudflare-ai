export var separatorStyle;
(function (separatorStyle) {
    separatorStyle[separatorStyle["NONE"] = 0] = "NONE";
    separatorStyle[separatorStyle["LLAMA_USER"] = 1] = "LLAMA_USER";
    separatorStyle[separatorStyle["LLAMA_SYSTEM"] = 2] = "LLAMA_SYSTEM";
})(separatorStyle || (separatorStyle = {}));
export const tgTemplates = {
    llama2: {
        separatorStyle: separatorStyle.LLAMA_SYSTEM,
        system: {
            default: "A chat between a curious human and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the human's questions.",
            pre: "[INST] <<SYS>>\n",
            post: "\n<</SYS>>\n [/INST]\n",
        },
        user: {
            pre: "[INST] ",
            post: " [/INST]\n",
        },
        assistant: {
            post: "\n",
        },
    },
    "codellama-instruct": {
        separatorStyle: separatorStyle.NONE,
        system: {
            default: "Write code to solve the following coding problem that obeys the constraints and passes the example test cases. Please wrap your code answer using ```:",
            pre: "[INST] ",
            post: "\n",
        },
        user: {
            post: "\n[/INST]\n",
        },
    },
    "mistral-instruct": {
        separatorStyle: separatorStyle.LLAMA_USER,
        user: {
            pre: "[INST] ",
            post: " [/INST]\n",
        },
    },
    zephyr: {
        separatorStyle: separatorStyle.NONE,
        user: {
            pre: "<|system|>\n</s>\n<|user|>\n",
            post: "</s>\n<|assistant|>\n",
        },
    },
};
export const generateTgTemplate = (messages, template) => {
    let prompt = "";
    for (const message of messages) {
        switch (message.role) {
            case "system":
                prompt += applyRole(template, message.role, message.content);
                break;
            case "user":
                prompt += applyRole(template, message.role, message.content);
                break;
            case "assistant":
                prompt += applyRole(template, message.role, message.content);
                break;
        }
    }
    return prompt;
};
export const applySeperator = (role, style, start) => {
    if (style == separatorStyle.LLAMA_SYSTEM) {
        if (role == "system" && start)
            return "<s>";
        if (role == "assistant" && !start)
            return "</s>";
    }
    if (style == separatorStyle.LLAMA_USER) {
        if (role == "user" && start)
            return "<s>";
    }
    return "";
};
export const applyRole = (template, role, content) => {
    if (tgTemplates[template] && tgTemplates[template][role]) {
        return (applySeperator(role, tgTemplates[template].separatorStyle, true) +
            (tgTemplates[template][role].pre || "") +
            (content || tgTemplates[template][role].default || "") +
            (tgTemplates[template][role].post || "") +
            applySeperator(role, tgTemplates[template].separatorStyle, false));
    }
    return content || "";
};
