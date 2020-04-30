new Vue({
	//which part of the HTML should be 'under control' of the Vue instance
	el: '#app',
  data: {
  	title: 'Hello World'
  },
  methods: {
  	changeTitle: function(){
    	//'this' gives you access to all data and methods of the vue instance.
      this.title = event.target.value;
    }
  }
});
