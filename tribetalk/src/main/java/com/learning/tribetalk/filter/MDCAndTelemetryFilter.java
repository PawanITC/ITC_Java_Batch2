package com.learning.tribetalk.filter;


import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;


@Component
public class MDCAndTelemetryFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        try {
            Span currentSpan=Span.current();
            SpanContext context=currentSpan.getSpanContext();
            System.out.println("Inside MDC");
            System.out.println("Trace valid? " + context.isValid() + ", TraceId: " + context.getTraceId());
            if(context.isValid()){
                MDC.put("trace_id",context.getTraceId());
                MDC.put("span_id",context.getSpanId());
            }
            String requestId=request.getHeader("X-Request-ID");
            if(requestId==null || requestId.isEmpty()){
                requestId= UUID.randomUUID().toString();
            }

            String user="";
            Authentication auth= SecurityContextHolder.getContext().getAuthentication();
            if(auth!=null && auth.isAuthenticated()){
                user= auth.getName();
            }
            else{
                user="Anonymous";
            }
            System.out.println("Inside MDC Filter:"+user);
            MDC.put("request_id",requestId);
            MDC.put("user",user);

            filterChain.doFilter(request,response);
        }
        finally {
            MDC.clear();
        }
    }
}
