package com.example.IPWA02_01_Ghost_Net_Fishing.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Leitet die Root-URL auf die statische HTML-Seite weiter.
 */
@Controller
public class MainController {
    /**
     * Forward auf classpath:/static/html/index.html.
     * @return Forward-String
     */
    @GetMapping("/")
    public String index() {
        return "forward:/html/index.html";
    }
}
