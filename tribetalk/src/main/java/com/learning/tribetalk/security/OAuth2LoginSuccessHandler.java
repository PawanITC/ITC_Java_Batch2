package com.learning.tribetalk.security;

import com.learning.tribetalk.dto.RegistrationRequest;
import com.learning.tribetalk.entity.Authority;
import com.learning.tribetalk.entity.User;
import com.learning.tribetalk.repository.AuthorityRepository;
import com.learning.tribetalk.service.GitHubEmailService;
import com.learning.tribetalk.service.UserService;
import com.learning.tribetalk.service.impl.UserServiceImpl;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class OAuth2LoginSuccessHandler extends SavedRequestAwareAuthenticationSuccessHandler {

    @Autowired
    private final UserService userService;

    @Autowired
    private final JwtUtil jwtUtils;

    private final OAuth2AuthorizedClientService authorizedClientService;


    @Autowired  // Spring will call this constructor automatically
    public OAuth2LoginSuccessHandler(UserService userService, JwtUtil jwtUtils, OAuth2AuthorizedClientService authorizedClientService) {
        this.userService = userService;
        this.jwtUtils = jwtUtils;
        this.authorizedClientService = authorizedClientService;
    }

    @Autowired
    AuthorityRepository roleRepository;

    @Autowired
    GitHubEmailService gitHubEmailService;

    @Value("${frontend.url}")
    private String frontendUrl;

    String username;
    String idAttributeKey;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2AuthenticationToken oAuth2AuthenticationToken = (OAuth2AuthenticationToken) authentication;
        if ("github".equals(oAuth2AuthenticationToken.getAuthorizedClientRegistrationId()) || "google".equals(oAuth2AuthenticationToken.getAuthorizedClientRegistrationId())) {
            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;

            OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient(
                    oauthToken.getAuthorizedClientRegistrationId(),
                    oauthToken.getName()
            );

            DefaultOAuth2User principal = (DefaultOAuth2User) authentication.getPrincipal();
            String accessToken = client.getAccessToken().getTokenValue();

            Map<String, Object> attributes = principal.getAttributes();
            String email = Optional.ofNullable(attributes.get("email"))
                    .map(Object::toString)
                    .orElseGet(() -> {

                        String token = client.getAccessToken().getTokenValue();
                        return gitHubEmailService.fetchPrimaryEmail(token);

                    });
            String name = Optional.ofNullable(attributes.get("name")).map(Object::toString).orElse("");
            if ("github".equals(oAuth2AuthenticationToken.getAuthorizedClientRegistrationId())) {
                username = attributes.getOrDefault("login", "").toString();
                idAttributeKey = "id";
            } else if ("google".equals(oAuth2AuthenticationToken.getAuthorizedClientRegistrationId())) {
                username = email.split("@")[0];
                idAttributeKey = "sub";
            } else {
                username = "";
                idAttributeKey = "id";
            }
            System.out.println("HELLO OAUTH: " + email + " : " + name + " : " + username);

            userService.findByEmail(email)
                    .ifPresentOrElse(user -> {
                        //  Convert existing authorities to SimpleGrantedAuthority
                        var authorities = user.getAuthorities().stream()
                                .map(auth -> new SimpleGrantedAuthority(auth.getAuthority()))
                                .toList();

                        DefaultOAuth2User oauthUser = new DefaultOAuth2User(
                                authorities,
                                attributes,
                                idAttributeKey
                        );

                        Authentication securityAuth = new OAuth2AuthenticationToken(
                                oauthUser,
                                authorities,
                                oAuth2AuthenticationToken.getAuthorizedClientRegistrationId()
                        );
                        SecurityContextHolder.getContext().setAuthentication(securityAuth);

                    }, () -> {
                        // New user registration
                        // Assign default authority
                        Authority roleUser = new Authority();
                        roleUser.setAuthority("ROLE_USER");
                        RegistrationRequest newUser = new RegistrationRequest(username, username, email, "oauth2", roleUser);
                        userService.registerUser(newUser);

                        var authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));

                        DefaultOAuth2User oauthUser = new DefaultOAuth2User(
                                authorities,
                                attributes,
                                idAttributeKey
                        );

                        Authentication securityAuth = new OAuth2AuthenticationToken(
                                oauthUser,
                                authorities,
                                oAuth2AuthenticationToken.getAuthorizedClientRegistrationId()
                        );
                        SecurityContextHolder.getContext().setAuthentication(securityAuth);
                    });
        }

        // ========== JWT TOKEN LOGIC ==========
        this.setAlwaysUseDefaultTargetUrl(true);

        DefaultOAuth2User oauth2User = (DefaultOAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oauth2User.getAttributes();
        String email = (String) attributes.get("email");
        System.out.println("OAuth2LoginSuccessHandler: " + email);

        // Create UserDetailsImpl using authorities
        var authorities = oauth2User.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .collect(Collectors.toList());


        // Generate JWT
        String jwtToken = jwtUtils.generateToken(email, authorities);

        ResponseCookie cookie = ResponseCookie.from("jwt", jwtToken)
                .httpOnly(true)
                .secure(false) // true in production (HTTPS)
                .path("/")
                .sameSite("Lax")
                .maxAge(Duration.ofDays(7))
                .build();

        // ✅ Add cookie to response header
        response.addHeader("Set-Cookie", cookie.toString());
        System.out.println(frontendUrl + "/oauth2/redirect");
        response.sendRedirect("/oauth2/redirect");
        //  Redirect frontend with JWT
        /*String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/redirect")
                .queryParam("token", jwtToken)
                .build().toUriString();
        //response.sendRedirect(targetUrl);
        this.setDefaultTargetUrl(targetUrl);
        super.onAuthenticationSuccess(request, response, authentication);*/
    }
}
