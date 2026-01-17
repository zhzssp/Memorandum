package org.zhzssp.memorandum.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Controller
public class FeatureSelectionController {

    private static final String SESSION_KEY = "selectedFeatures";

    @GetMapping("/select-features")
    public String selectFeaturesPage() {
        return "selectFeatures"; // render selectFeatures.html
    }

    @PostMapping("/select-features")
    public String saveSelectedFeatures(@RequestParam(name = "selectedFeatures", required = false) List<String> features,
                                       HttpSession session) {
        // Ensure non-null and store as a Set for convenience
        Set<String> featureSet = features != null ? new HashSet<>(features) : new HashSet<>();
        session.setAttribute(SESSION_KEY, featureSet);
        // After saving, redirect to dashboard which will respect these settings
        return "redirect:/dashboard";
    }

    /**
     * Utility method that other controllers/views can use to fetch the selected feature set from the session.
     */
    @SuppressWarnings("unchecked")
    public static Set<String> getSelectedFeatures(HttpSession session) {
        Object obj = session.getAttribute(SESSION_KEY);
        if (obj instanceof Set) {
            return (Set<String>) obj;
        }
        return new HashSet<>();
    }
}
