module.exports = (function() {

	var rData = {};

	rData.rooms = {};

	rData.randomString = function ( m ) {
		m = m || 5;
		var s = '', r = 'abcdefghjkmnpqrstuvwxyz23456789'; // 31^5 = 28,629,151
		for ( var i = 0; i < m; i++ )
			s += r.charAt( Math.floor( Math.random() * r.length ) );
		return s;
	};

	return rData;

})();
