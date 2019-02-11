

# SPA Login Quickstart

The purpose of this article is to demonstrate how simple to set up and use the new Single Page Application SDK to authenticate a user in your application using Auth0's Universal Login Page.

## Create a basic HTML

Start by creating a project folder and adding an `index.html` file. This HTML page will display a welcome message and have a Profile section which the user requires to be authenticated before accessing. You can copy/paste the following content into the file. You will add a few more lines as you progress with this article:

```html
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8">
  <title>SPA SDK Sample</title>
</head>

<body>
  <h2>SPA Authentication Sample</h2>
  <p>Welcome to our page!</p>
  <button id="btn-login" disabled="true" onclick="login()">Log in</button>
  <button id="btn-logout" disabled="true" onclick="logout()">Log out</button>
</body>

</html>
```

### Reference the SDK

This article is based on the new SPA SDK available [here](https://github.com/auth0/auth0-login/). You can reference the package on the CDN from the HTML file in the following way:

```html
<body>
  <!-- add the lines below -->
  <script src="https://unpkg.com/@auth0/auth0-login@0.0.1-alpha.15/dist/auth0-login.production.legacy.js" />
  <script src="js/a0-variables.js"></script>
  <script src="js/app.js"></script>
</body>
```

Note this is making use of the version `0.0.1-alpha.15`. You might need to change this to a newer one when available.


Alternatively, install the package locally with NPM.

```bash
npm i @auth0/auth0-login --save
```

Then link the module and the application code in the `index.html` file by adding the following lines.

```html
<body>
  <!-- add the lines below -->
  <script src="node_modules/@auth0/auth0-login/dist/auth0-login.development.js"></script>
  <script src="js/a0-variables.js"></script>
  <script src="js/app.js"></script>
</body>
```


## Setup

You may have noticed there is a reference to a `js/app.js` and a `js/a0-variables.js` file above. This are going to contain the application logic and the Auth0 client information respectively. Go ahead and create both files before continuing.


### Auth0 Dashboard

Access the [Auth0 dashboard](https://manage.auth0.com/#/applications) and go into the Applications section.
 1. Create a new Application of type "Single Page Application" by giving it a name of choice. The dashboard redirects you to the quickstart which you can skip and go straight to "Settings" tab. 
 2. At the top of the page are displayed the `client_id` and `domain` values. Take note of them as you will be using them later.
 2. Add `http://localhost:3000/callback` into the "Allowed Callback URLs" box.
 3. Add `http://localhost:3000` into the "Allowed Web Origins" and the "Allowed Logout URLs" boxes.
 4. Click the `SAVE CHANGES` button to save the configuration.
 5. Go to the "Connections" tab and enable the connections you wish to use for authentication. e.g. Username-Password-Authentication.

In the `js/a0-variables.js` you need to place the information collected in the step (1) above in the following way:

```js
AUTH0_DOMAIN = "yourcompany.auth0.com";
AUTH0_CLIENT_ID = "yourclientid";
```


### The application

Open the `js/app.js` file to start adding the client side logic. 


#### Initialization
First things first. The SDK needs to be properly initialized with the information of the application created above. Because you have already saved this in the `js/a0-variables.js` file and then referenced it from the HTML file, the data is accessible. As soon as the page loads, you need to call `init()`. This call will populate the in-memory cache with a valid access token and user information if someone has already authenticated before and that session is still valid.

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
}
```

**Checkpoint:** At this point you can start testing how it looks and works so far. For that, you could use a tool like [serve](https://github.com/zeit/serve). Install it globally and run the project on the port 3000:

```bash
npm i serve -g
serve -p 3000
```

Now go and access it at [http://localhost:3000](http://localhost:3000). You should see the welcome message and the login button.

#### Evaluating the authentication state
As a first approach, you want to make sure anyone is able to visit the public page but not the protected contents' page, such as a settings panel or the user profile details. You can decide which content is available by hidding, disabling or removing it if no user is currently logged in. You do so by checking the result of calling the `isAuthenticated()` method. Let's use this to enable or disable the "Log In" and "Log Out" buttons, which are disabled by default. This can make a "updateUI" function and be called on the `window.onload` method.

```js
let updateUI = async () => {
  let isAuthenticated = await auth0.isAuthenticated();
  document.getElementById("btn-logout").disabled = !isAuthenticated;
  document.getElementById("btn-login").disabled = isAuthenticated;
}
```

**Checkpoint:** If you run the project again, you should see that the "Log in" button is shown as no user has previously logged in.


#### Performing the authentication

Authentication is achieved through a redirect to the Auth0 [Universal Login Page](https://auth0.com/docs/hosted-pages/login). Once the user signs up or signs in, the result will be passed to the redirect URI given as part of the authentication call.

Start the authentication on the log in button click by calling the `loginWithRedirect()` method, passing a valid redirect URI. In this sample you will redirect the user back to the same page they are now. You can obtain that value from `window.location.origin`.

```js
async () => {
  try {
    await auth0.loginWithRedirect({
      redirect_uri: window.location.origin
    });
  } catch (err) {
    console.log("Authentication failed" + err);
  }
}
```

Because this is a *single page application*, the result of this call needs to be handled on the same context. This means that when the page is loaded and the user is not authenticated you could be in one of the following two scenarios:

1. The user does not want to authenticate and is just navigating through public content or
2. The user has recently initiated the authentication process and is now looking to complete it.

This second scenario is the one you need to handle. In your `window.onload` method you want to check if the user is not authenticated and the URL query contains both the `code` and the `state` parameters. This will indicate that a result is present and needs to be parsed. Do so by calling the `handleRedirectCallback()` method. This will attempt exchange the result that the Auth0 backend gave you back for real tokens you can use.


```js
async () => {
  let isAuthenticated = await auth0.isAuthenticated();
  if (isAuthenticated) {
    //...
  } else {
    //...
    const query = window.location.search;
    if (query.includes('code=') && query.includes('state=')) {
        await auth0.handleRedirectCallback();
        isAuthenticated = await auth0.isAuthenticated();
        
        //Clear the query parameters
        window.history.replaceState({}, document.title, "/");
    }
  }
}
```

See how after handling the result the `isAuthenticated()` method is called again. This is to ensure you get a fresh authentication state value and that nothing wrong happened in the exchange request. There is also an important step you need to do right after this. You need to remove the query parameters so that if the user refreshes the page this is not taken as if a new exchange needs to be attempted.


**Checkpoint:** Run the project and click the Log in button. You should be taken to the Universal Login Page configured for your application. Go ahead and create a new user or log in using a social connection. After authenticating successfully, you will be redirected to the page you were before. This time, the result will be present in the URL query and the exchange will happen automatically. If everything went fine, you will end up with no query parameters in the URL and the user would now be logged in.

Note you may see configuration errors if you forget to whitelist the callback URL or the allowed origins as explained initially.


#### Reading the user profile

Everytime a user is logged in you get access both to the **access token** and the associated **user profile** information. You can use this token to call your backend application and the profile information to display their name and profile picture, typically. In this article you are going to display them in separate text areas so you can easily inspect them. Open the `index.html` file and insert at the bottom of the body the following gated content.

```html
<body>
  <!-- ... -->

  <div class="hidden" id="gated-content">
    <p>
      You're seeing this content because you're currently <strong>logged in</strong>.
    </p>
    <label>
      Access token: <textarea readonly="true" rows="1" id="ipt-access-token"></textarea>
    </label>
    <label>
      User profile: <textarea readonly="true" rows="12" id="ipt-user-profile"></textarea>
    </label>
  </div>
</body>
```

Now open the `app.js` file and modify the `updateUI` function declared previously. Add the logic such that when the user is logged in the gated content is shown. Use the existing `isAuthenticated` variable and the `getTokenSilently()` and `getUser()` functions to obtain and display this information in the text areas. The sample contains a small CSS class called "hidden" used to give the `display=none` property to the HTML elements you need to hide, as shown below: 

```js
let updateUI = async () => {
  // previous function content removed for clarity
  if (isAuthenticated){
    document.getElementById("gated-content").classList.remove('hidden');
    document.getElementById("ipt-access-token").value = await auth0.getTokenSilently();
    document.getElementById("ipt-user-profile").value = JSON.stringify(await auth0.getUser());
  } else {
    document.getElementById("gated-content").classList.add('hidden');
  }
}
```

Do note that the calls will throw if there is no user currently authenticated or if the token needs to be refreshed and that request fails. You will need to try/catch around them to correctly handle any errors. This error check is not shown on the article but it is present on the final sample app that you can download.


**Checkpoint:** Go ahead and run the project for the last time. Now if the user is authenticated you will get to see their access token and profile data. This content will disappear if you log out.
