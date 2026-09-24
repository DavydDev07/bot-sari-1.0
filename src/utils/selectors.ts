export const selectors = {
    login: {
        usernameInput: 'input#j_username, input[name="j_username"]',
        passwordInput: 'input#j_password, input[name="j_password"], input[type="password"]',
        submitButton: 'input[type="submit"][value="Entrar"], button:has-text("Entrar"), a:has-text("Entrar")'
    },

    navigation: {
        requestTicketLink: 'a[href*="/modulos/minhaConta/solicitarTickets.jsf"], a:has-text("Solicitar Ticket")'
    },

    tickets: {
        card: "div.ui-panel-m-content.ui-body.ui-body-inherit",
        addButton: 'button[title="Adicionar Ticket"]'
    },

    captcha: {
        responseField: 'textarea#g-recaptcha-response, textarea[name="g-recaptcha-response"]'
    },

    result: {
        activePopup: "div.ui-popup-container.pop.in.ui-popup-active"
    }
};