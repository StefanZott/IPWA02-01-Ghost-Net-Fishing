package com.example.IPWA02_01_Ghost_Net_Fishing.dto;

public class LoginResponse {

    private boolean success;
    private String message;
    private String username;

    public LoginResponse(boolean success, String message, String username) {
        this.success = success;
        this.message = message;
        this.username = username;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }
}
