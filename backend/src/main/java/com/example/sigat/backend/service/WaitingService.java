package com.example.sigat.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class WaitingService {
    @Value("${geo_api_wait:0}")
    private int time;
    public void acquire() {
        if (time>0){
            try {
                Thread.sleep(time);
            } catch (InterruptedException ignore){}
        }
    }
}
