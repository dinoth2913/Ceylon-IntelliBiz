package com.ceylon.intellibiz.config;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

/**
 * A safety net for the gap SecurityConfig's own comment warns about: "anything under /api nobody
 * listed above is admin-only" is a safe default, but it's easy to add a new controller and forget the
 * SecurityConfig line entirely — the endpoint still works (locked to admins), so nothing breaks and
 * nothing tells you. This scans every controller's source for its base path and fails if that path
 * string is never mentioned in SecurityConfig.java, so a new controller forces a conscious decision
 * ("yes, admin-only is right" or "add a real rule") instead of a silent one. It only checks that the
 * path is *mentioned* — RoleAccessRulesTest is what checks the rule is actually correct.
 */
class SecurityCoverageTest {

    private static final Pattern CLASS_BASE_PATH = Pattern.compile("@RequestMapping\\(\"(/api[^\"]*)\"\\)");
    private static final Pattern METHOD_PATH =
        Pattern.compile("@(?:Get|Post|Put|Delete|Patch)Mapping\\(\"([^\"]+)\"\\)");

    @Test
    void everyControllersBasePathIsMentionedInSecurityConfig() throws IOException {
        Path securityConfigFile =
            Path.of("src/main/java/com/ceylon/intellibiz/config/SecurityConfig.java");
        String securityConfigSource = Files.readString(securityConfigFile);

        Path controllerDir = Path.of("src/main/java/com/ceylon/intellibiz/controller");
        List<String> missing = new ArrayList<>();

        try (Stream<Path> files = Files.list(controllerDir)) {
            for (Path file : files.filter(f -> f.toString().endsWith(".java")).sorted().toList()) {
                String source = Files.readString(file);
                Matcher classMatch = CLASS_BASE_PATH.matcher(source);
                if (!classMatch.find()) {
                    continue; // not a @RestController with its own base path (e.g. an advice class)
                }

                String path = classMatch.group(1);
                if (path.equals("/api")) {
                    // Too generic to search for on its own — fall back to base + first method path.
                    Matcher methodMatch = METHOD_PATH.matcher(source);
                    if (methodMatch.find()) {
                        path = path + methodMatch.group(1);
                    }
                }

                if (!securityConfigSource.contains(path)) {
                    missing.add(file.getFileName() + " -> \"" + path + "\"");
                }
            }
        }

        assertTrue(missing.isEmpty(),
            "These controllers aren't mentioned anywhere in SecurityConfig.java. The fail-closed default "
                + "still makes them admin-only, so nothing is insecure — but add an explicit rule (or a comment "
                + "saying admin-only is intentional) and a RoleAccessRulesTest case, so it's a choice, not an "
                + "accident: " + missing);
    }
}
