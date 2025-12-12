package com.learning.tribetalk.metrics;

import com.learning.tribetalk.metrics.annotations.BusinessMetric;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.annotation.PostConstruct;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Aspect
@Component
public class BusinessMetricsAspect {

    private final MeterRegistry meterRegistry;

    public BusinessMetricsAspect(MeterRegistry meterRegistry){
        this.meterRegistry=meterRegistry;
    }


    @PostConstruct
    public void init(){
        System.out.println("BusinessMetricsAspect bean created");
    }

    @Around("@annotation(metric)")
    public Object trackBusinessMetrics(ProceedingJoinPoint pjp, BusinessMetric metric) throws Throwable{

        String baseName="business_"+metric.value().replace(".","_");
        Counter counter= Counter.builder(baseName+"_total")
                .description("Successful "+metric.value()).register(meterRegistry);

        Timer timer=Timer.builder(baseName+"_timer")
                .description("Execution time for "+metric.value())
                .register(meterRegistry);

        long start=System.nanoTime();
        try{
            Object result=pjp.proceed();
            counter.increment();
            return result;
        }
        catch (Exception ex){
            Counter failureCounter= Counter.builder(baseName+"_failures_total")
                    .description("Failed for "+metric.value())
                    .tag("Exception",ex.getClass().getSimpleName()).register(meterRegistry);
            failureCounter.increment();
            throw ex;
        }
        finally {
            timer.record(System.nanoTime()-start, TimeUnit.NANOSECONDS);
        }
    }
}
