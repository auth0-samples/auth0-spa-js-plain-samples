# SPA Login Quickstart

The purpose of this article is to demonstrate how simple it is to set up and use the new Single Page Application SDK. Authenticate a user in your application using Auth0's Universal Login Page.

## Specifying Auth0 Credentials

To specify the application client ID and domain, make a copy of `auth_config.json.example` and rename it to `auth_config.json`. Then open it in a text editor and supply the values for your application:

```json
{
  "domain": "{DOMAIN}",
  "clientId": "{CLIENT_ID}"
}
```

## Installation

After cloning the repository, run:

```bash
$ npm install
```

This will install all of the necessary packages in order for the sample to run.

## Running the Application

This version of the application requires an HTTP server that can serve the site from a single page. To start the app from the terminal, run:

```bash
$ npm run dev
```

## Create a basic HTML (outdated)

**NOTE**: The rest of this readme should be considered outdated, and requires changes to bring it inline with the new changes to the app.

Start by creating a project folder and adding an `index.html` file. This HTML page will display a welcome message and have a "gated" section which the user requires to be authenticated before accessing. You can copy/paste the following content into the file. You will be adding more lines as you progress with this article:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>SPA SDK Sample</title>
    <link rel="stylesheet" type="text/css" href="css/main.css" />
  </head>

  <body>
    <h2>SPA Authentication Sample</h2>
    <p>Welcome to our page!</p>
    <button id="btn-login" disabled="true" onclick="login()">Log in</button>
    <button id="btn-logout" disabled="true" onclick="logout()">Log out</button>
  </body>
</html>
```

Additionally, create a simple CSS file under `css/main.css` to define how the gated content elements will be hidden in the page. Add the following class matchers:

```css
.hidden {
  display: none;
}
label {
  margin-bottom: 10px;
  display: block;
}
```

### Reference the SDK

This article is based on the new SPA SDK available [here](https://github.com/auth0/auth0-login/). You can reference the package on the CDN from the `index.html` file in the following way:

```html
<body>
  <!-- add the lines below -->
  <script src="https://unpkg.com/@auth0/auth0-login@0.0.1-alpha.15/dist/auth0-login.production.legacy.js"></script>
  <script src="js/a0-variables.js"></script>
  <script src="js/app.js"></script>
</body>
```

Note this is making use of the version `0.0.1-alpha.15`. You might need to change this to a newer one when available.

## Setup

You may have noticed there is a reference to a `js/app.js` and a `js/a0-variables.js` file above. These are going to contain the application logic and the Auth0 client information respectively. Go ahead and create both files in the `js` folder before continuing.

### Auth0 Dashboard

Access the [Auth0 dashboard](https://manage.auth0.com/#/applications) and go into the Applications section.

1.  Create a new Application of type "Single Page Application" by giving it a name of choice and clicking "Create". The dashboard redirects you to the quickstart which you can skip and go straight to "Settings" tab.
2.  At the top of the page are displayed the `client_id` and `domain` values. Take note of them as you will be using them later.
3.  Add `http://localhost:3000` into the "Allowed Callback URLs" box.
4.  Add `http://localhost:3000` into the "Allowed Web Origins" box.
5.  Lastly, add `http://localhost:3000` into the "Allowed Logout URLs" box.
6.  Click the `SAVE CHANGES` button to save the configuration.
7.  Go to the "Connections" tab and enable the connections you wish to use for authentication. e.g. the default "Username-Password-Authentication".

In the `js/a0-variables.js` you need to place the information collected in the step (2) above in the following way:

```js
AUTH0_DOMAIN = "yourcompany.auth0.com";
AUTH0_CLIENT_ID = "yourclientid";
```

### The application

Open the `js/app.js` file to start adding the client side logic.

#### Initialization

First things first. The SDK needs to be properly initialized with the information of the application created above. Because you have already saved this in the `js/a0-variables.js` file and are referencing it from the HTML file, the data is accessible from this file. As soon as the page loads you need to call `auth0.init()`. This call will populate the in-memory cache with a valid access token and user profile information if someone has already authenticated before and that session is still valid.

```js
//declare and setup the instance
const auth0 = new Auth0Login({
  //values are read from a0-variables.js file
  domain: AUTH0_DOMAIN,
  client_id: AUTH0_CLIENT_ID
});

window.onload = async () => {
  // don't forget to call this!
  await auth0.init();
  //...
};
```

**Checkpoint:** At this point you can start testing how it looks so far. For that, you could use a tool like [serve](https://github.com/zeit/serve). If your `npm` version is `5.2.0` or newer you can take advantage of the `npx` command to run a package without installing it. Use the following command to run the project on the port 3000:

```bash
npx serve -p 3000
```

If you are running an older version of `npm`, install the package globally and run the project on the port 3000 like this:

```bash
npm i serve -g
serve -p 3000
```

Now go and access it at [http://localhost:3000](http://localhost:3000). You should see the welcome message and both authentication buttons disabled. Note however that some browsers cache the page sources. When checking each step results you should perform a full page refresh ignoring the cache. This can be achieved in Chrome by using the `CMD+SHIFT+R` keys on OSX and `CTRL+SHIFT+R` keys on Windows.

#### Evaluating the authentication state

As a first approach, you want to make sure anyone is able to visit the public page but not the protected contents' page, such as a settings panel or the user profile details. You can decide which content is available by hidding, disabling or removing it if no user is currently logged in. You do so by checking the result of calling the `auth0.isAuthenticated()` method. Use this to enable or disable the "Log in" and "Log out" buttons, which are disabled by default. This can be part of a `updateUI()` function called from the `window.onload` method right after the initialization.

```js
window.onload = async () => {
  // initialization
  updateUI();
};

const updateUI = async () => {
  const isAuthenticated = await auth0.isAuthenticated();
  document.getElementById("btn-logout").disabled = !isAuthenticated;
  document.getElementById("btn-login").disabled = isAuthenticated;
};
```

**Checkpoint:** If you run the project again, you should see that the "Log in" button is shown as enabled as no user has previously logged in. But clicking it will not do anything as there is no logic associated to that action yet.

#### Performing the authentication

Authentication is achieved through a redirect to the Auth0 [Universal Login Page](https://auth0.com/docs/hosted-pages/login). Once the user signs up or signs in, the result will be passed to the redirect URI given as part of the authentication call.

Start the authentication on the "Log in" button click by calling the `auth0.loginWithRedirect()` method passing a valid redirect URI. In this sample you will redirect the user back to the same page they are now. You can obtain that value from `window.location.origin` property. Abstract this logic into a `login()` method.

```js
const login = async () => {
  await auth0.loginWithRedirect({
    redirect_uri: window.location.origin
  });
};
```

Additionally, because this is a _single page application_, the result of this call needs to be handled on the same context. This means that when the page is loaded and the user is not authenticated you could be in one of the following two scenarios:

1. The user does not want to authenticate and is just navigating through public content or
2. The user has recently initiated the authentication process and is now looking to complete it.

This second scenario is the one you need to handle. In your `window.onload` method you want to check if the user is not authenticated and the URL query contains both the `code` and the `state` parameters. This will indicate that an authentication result is present and needs to be parsed. In that scenario, you do so by calling the `auth0.handleRedirectCallback()` method. This will attempt to exchange the result that the Auth0 backend gave you back for real tokens you can use.

```js
window.onload = async () => {
  // code ommited for brevity
  updateUI();
  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    // show the gated content
  } else {
    // check the current scenario
    const query = window.location.search;
    if (query.includes("code=") && query.includes("state=")) {
      await auth0.handleRedirectCallback();
      updateUI();
      window.history.replaceState({}, document.title, "/");
    }
  }
};
```

Now the redirect is properly handled and the authentication can be completed successfully, but you need to remove the query parameters from the URL so that if the user refreshes the page this is not considered as if a new exchange needs to be done. This is achieved with the `window.history.replaceState` method.

**Checkpoint:** Run the project and click the "Log in" button. You should be taken to the Universal Login Page configured for your application. Go ahead and create a new user or log in using a social connection. After authenticating successfully, you will be redirected to the page you were before. This time, the result will be present in the URL query and the exchange will happen automatically. If everything went fine, you will end up with no query parameters in the URL, the user would now be logged in and the "Log out" button will be enabled.

If at this part you see any errors on the Auth0 page, check that you have not forgotten to whitelist the callback URL or the allowed origins as explained initially.

#### Logging the user out

You may have noticed that the "Log out" button is clickable when the user is authenticated but it does nothing. You need to add the code that will log the user out from the Auth0 backend.

Start the log out by calling the `auth0.logout()` method passing a valid return-to URI. In this sample you will return the user back to the same page they are now. You can obtain that value from `window.location.origin` property. Abstract this logic into a `logout()` method.

```js
const logout = () => {
  auth0.logout({
    returnTo: window.location.origin
  });
};
```

**Checkpoint:** Being authenticated click the "Log out" button. You should be taken to the Universal Login Page configured for your application and then back to the page you were before. Now the authentication cookies were cleared and the user is logged out. The "Log in" button will be enabled back again.

If at this part you see any errors on the Auth0 page, check that you have not forgotten to whitelist the logout url as explained initially.

#### Reading the user profile

Everytime a user is logged in you get access both to the **access token** and the associated **user profile** information. You can use this token to call your backend application and the profile information to display their name and profile picture, typically. In this guide you are going to display them in separate text areas so you can easily inspect them. Open the `index.html` file and insert the following lines at the bottom of the body.

```html
<body>
  <!-- ... -->

  <div class="hidden" id="gated-content">
    <p>
      You're seeing this content because you're currently
      <strong>logged in</strong>.
    </p>
    <label>
      Access token:
      <textarea readonly="true" rows="1" id="ipt-access-token"></textarea>
    </label>
    <label>
      User profile:
      <textarea readonly="true" rows="12" id="ipt-user-profile"></textarea>
    </label>
  </div>
</body>
```

Now open the `app.js` file and modify the `updateUI()` function declared previously. Add the logic such that when the user is logged in the gated content is shown. Use the existing `isAuthenticated` variable and the `auth0.getTokenSilently()` and `auth0.getUser()` functions to obtain and display this information in the text areas.

At the start of this article you have added a `css/main.css` file with the definition of the `hidden` class. This is used to give the `display=none` style property to the HTML elements you want to hide. Using the authenticated flag as shown below, add or remove this class to the elements you want to show or hide in the `updateUI()` function:

```js
const updateUI = async () => {
  // code ommited for brevity
  if (isAuthenticated) {
    document.getElementById("gated-content").classList.remove("hidden");
    document.getElementById(
      "ipt-access-token"
    ).value = await auth0.getTokenSilently();
    document.getElementById("ipt-user-profile").value = JSON.stringify(
      await auth0.getUser()
    );
  } else {
    document.getElementById("gated-content").classList.add("hidden");
  }
};
```

Do note that calls to the SDK instance can throw an exception if the authentication fails, if there is no user currently authenticated or if the token needs to be refreshed and that request fails. You will need to try/catch around them to correctly handle any errors. These error checks are not shown on the article but they are available on the final sample app that you can download.

**Checkpoint:** Go ahead and run the project for the last time. Now if the user is authenticated you will get to see their access token and profile data. See how this content disappears when you log out.
