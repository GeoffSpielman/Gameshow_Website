new Vue({
	//which part of the HTML should be 'under control' of the Vue instance
	el: '#app',
  data: {
  	title: 'Hello World'
  },
  methods: {
  	userPressedEnter: function(){
    	alert("pressedEnter")
    }
  }
});
