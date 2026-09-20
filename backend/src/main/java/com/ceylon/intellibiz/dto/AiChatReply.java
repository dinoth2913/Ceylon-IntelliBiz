package com.ceylon.intellibiz.dto;

import java.util.List;

public record AiChatReply(String reply, String intent, List<String> suggestions) {

    public AiChatReply {
        suggestions = suggestions == null ? List.of() : suggestions;
    }
}
