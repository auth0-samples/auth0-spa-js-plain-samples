//Initialize the auth0 login instance
const auth0 = new Auth0Login({
  domain: AUTH0_DOMAIN,
  client_id: AUTH0_CLIENT_ID
});

//Declare helper functions

let logout = () => {
  try {
    console.log("Logging out");
    auth0.logout({
      returnTo: window.location.origin
    });
  } catch (err) {
    console.log("Log out failed", err);
  }
}

let login = async () => {
  try {
    console.log("Logging in");
    await auth0.loginWithRedirect({
      redirect_uri: window.location.origin
    });
  } catch (err) {
    console.log("Log in failed", err);
  }
}

let updateUI = async () => {
  try {
    const isAuthenticated = await auth0.isAuthenticated();
    document.getElementById("btn-logout").disabled = !isAuthenticated;
    document.getElementById("btn-login").disabled = isAuthenticated;
    if (isAuthenticated){
      document.getElementById("gated-content").classList.remove('hidden');
      document.getElementById("ipt-access-token").value = await auth0.getTokenSilently();
      document.getElementById("ipt-user-profile").value = JSON.stringify(await auth0.getUser());
    } else {
      document.getElementById("gated-content").classList.add('hidden');
    }
  } catch(err){
    console.log("Error updating UI!", err);
    return;
  }
  console.log("UI updated");
}

// Will run when page finishes loading
window.onload = async () => {
  await auth0.init();

  updateUI();
  let isAuthenticated = await auth0.isAuthenticated();
  if (isAuthenticated) {
    console.log("> User is authenticated");
  } else {
    console.log("> User not authenticated");
    const query = window.location.search;
    if (query.includes('code=') && query.includes('state=')) {
      console.log("> Parsing redirect");
      try {
        await auth0.handleRedirectCallback();
        console.log("Logged in!");
        updateUI();
      } catch (err) {
        console.log("Error parsing redirect:", err);
      }
      //don't do -> does a full page refresh
      //window.location.assign("/");
      window.history.replaceState({}, document.title, "/");
    }
  }
};