(function($, undefined) {

	$.widget('NSM.sectionComments', {

		// all these "global" variables can be called like: this.blah
		// also this.element is the widget instance
		options: {
			animate: false,
			selectors: {
				comments: '.comments',
				comment: '.comment',
				commentForm: '.comment-form',
				commentTotal: '.comment-total',
				parentCommentIdInput: 'input[name=parent_id]',
				sectionIdInput: 'input[name=section_id]',
				commentReplyTrigger: '> .comment-reply-trigger'
				
			},
			classes: {
				commentTotal: 'comment-total',
				commentReplyTrigger: 'comment-reply-trigger'
			}
		},

		// this is an object of all our sections
		// the key is the section id
		// the value is a jquery element
		// each section stores it's comments in .data('comments')
		// each section stores it's comment count in .data('comment-totals)
		sections: {},
		originalComments: false,

		// called once for each element
		_create: function () {
			console.log('_create NSM.sectionComments', this);
			var self = this,
				options = self.options;

			// Cache the original comments so we don't get duplicates
			this.originalComments = $(options.selectors.comments, this.element);
		},

		// called everytime ‘.comments()’ is executed on an element.
		_init: function () {
			console.log('_init NSM.sectionComments');

			// loop over each of the sections and add them to the array
			var $sections = $(".section", this.element);
			for (var i = $sections.length - 1; i >= 0; i--){
				var $section = $sections.eq(i);
				var sectionId = $section.data('sectionId');
				if(sectionId) {
					this.sections[sectionId] = $section;
				}
			}
			// calculate the comment count for each element
			this._createSectionCommentTotalElements();
			this.calculateSectionCommentCount();

			this._initCommentReplyElements(this.originalComments);

			// setup events
			this._setupEvents();
		},

		// Create the elements for the comment count.
		// Don't fill them yet
		// we'll do that in a public method so it can be called if comments are added via ajax
		_createSectionCommentTotalElements: function(){
			console.log('_createSectionCommentTotalElements NSM.sectionComments');

			for (var sectionId in this.sections) {

				var $section = this.sections[sectionId],
					$commentTotal = $(this.options.selectors.commentTotal, $section);

				if(! $commentTotal.length) {
					$commentTotal = $('<span />')
									.addClass(this.options.classes.commentTotal)
									.appendTo($section)
									.data("sectionId", sectionId);
				}
				$section.data("commentTotal", $commentTotal);
			}
		},

		// Calculate the comments for the section
		calculateSectionCommentCount: function(){
			console.log('_calculateCommentCount NSM.sectionComments');

			// Loop over the comments and calculate the totals
			var sectionCommentTotals = {};
			var $comments = $(".comment", this.originalComments).each(function(index) {
				var $comment = $(this);
				var sectionId = $comment.attr('data-sectionId');
				if(sectionId) {
					sectionCommentTotals[sectionId] = sectionCommentTotals[sectionId] + 1 || 1;
				}
			});

			for (var sectionId in this.sections) {
				var $section = this.sections[sectionId];
				var $sectionCommentTotal = $section.data('commentTotal');
				var sectionCommentTotal = sectionCommentTotals[sectionId] || 0;
				$sectionCommentTotal.text(sectionCommentTotal + " comments");
			}
		},

		// Load the comments for the section
		loadSectionComments: function(sectionId) {
			console.log('_loadSectionComments NSM.sectionComments');

			var classes = this.options.classes,
				selectors = this.options.selectors,
				$section = this.sections[sectionId];

			// Test to see if there are any existing comments
			// if so remove them so we can refresh the list / form if needed
			var $sectionComments = $section.data('comments');
			if($sectionComments) {
				$sectionComments.remove();
			}

			$sectionComments = this.originalComments
									.clone(true) // clone it
									.data("clone", true); // let everyone know this is a clone

			// find the form and set the input values
			var $sectionCommentForm = $(selectors.commentForm, $sectionComments)
										.find(selectors.sectionIdInput).val(sectionId).end()
										.find(selectors.parentCommentIdInput).val(0).end();

			this._initCommentReplyElements($sectionComments);

			$sectionComments
				// remove comments that don't apply to this section
				.find(selectors.comment+"[data-sectionId!="+sectionId+"]").remove().end()
				// update the comment reply trigger with the new section
				.find(this.options.classes).data({
					'sectionId': parseInt(sectionId),
				}).end()
				// append the new comments to the section
				.appendTo($section);

			this.sections[sectionId].data('comments', $sectionComments);

			this._trigger('loadsectioncomments', {}, 
				$.extend(this._uiHash(), {
					comments: $sectionComments,
					sectionId: sectionId
				})
			);
		},

		// Toggle the section comments
		// Load them if we have to first
		toggleSectionComments: function(sectionId) {

			if(!this.sections[sectionId].data('comments')) {
				this.loadSectionComments(sectionId);
			}

			this.sections[sectionId].data('comments').toggleClass('open');
		},

		commentReplyTrigger: function(){
			var classes = this.options.classes,
				$trigger = $('<a />')
					.attr({ href: "#" })
					.addClass(classes.commentReplyTrigger)
					.text("Reply to this comment");
			return $trigger;
		},

		// For each comment create a reply link scoped to a group of comments
		_initCommentReplyElements: function(comments){
			console.log('_createCommentReplyElements NSM.sectionComments');

			var self = this,
				options = this.options,
				classes = this.options.classes,
				selectors = this.options.selectors,
				$comments = $(comments),
				$commentEls = $(".comment", $comments);

			for (var i = $commentEls.length - 1; i >= 0; i--){
				var $comment = $commentEls.eq(i),
					commentId = $comment.data('commentId') || 0,
					sectionId = $comment.data('sectionId') || 0,
					$trigger = $(selectors.commentReplyTrigger, $comment);

				if(!$trigger.length) {
					$trigger = this.commentReplyTrigger();
					$comment.prepend($trigger);
				}

				$trigger.data({
					'commentId': commentId,
					'comments': $comments,
					'comment' : $comment,
					'sectionId': sectionId
				});
			};
		},

		// Comment on a comment
		_commentOnComment: function(event) {
			console.log('_commentOnComment NSM.sectionComments');
			event.preventDefault();

			var $eventTarget = $(event.target),
				commentId = $eventTarget.data("commentId") || 0,
				sectionId = $eventTarget.data("sectionId") || 0,
				$comments = $eventTarget.data("comments"),
				$comment = $eventTarget.data("comment");

				console.log($eventTarget);
			$comments.find(this.options.selectors.parentCommentIdInput).val(commentId);
			$comments.find(this.options.selectors.sectionIdInput).val(sectionId);

			this._trigger('commentreply', event, 
				$.extend(this._uiHash(), {
					commentId: commentId,
					comments: $comments,
					comment: $comment,
					sectionId: sectionId
				})
			);

		},

		_setupEvents: function(){
			var self = this;
			$(".comment-total", this.element).each(function(index) {
				var $trigger = $(this),
					sectionId = $trigger.data('sectionId') || false;

				$trigger.bind('click', function(){
					return self.toggleSectionComments(sectionId);
				});
			});

			$(".comment-reply-trigger", this.element)
				.bind('click', $.proxy( this, "_commentOnComment" ))
		},

		// Sets a value of the options.
		_setOption: function(key, value) {

			var oldValue = this.options[key] || undefined;

			// Call the base _setOption method
			$.Widget.prototype._setOption.apply(this, arguments);

			// The widget factory doesn't fire an callback for options changes by default
			// In order to allow the user to respond, fire our own callback
			this._trigger("setOption", { type: "setOption" }, {
				option: key,
				original: oldValue,
				current: value
			});
		},

		// Use the destroy method to reverse everything your plugin has applied
		destroy: function() {

			console.log('_destroy NSM.sectionComments');

			// 1. Remove any new elements that you created
			// 2. Unbind any events that may still exist
			// 3. Remove any classes, including CSS framework classes, that you applied
			// After you're done, you still need to invoke the "base" destroy method
			// Does nice things like unbind all namespaced events on the original element
			$.Widget.prototype.destroy.call(this);
		},

		_uiHash: function(inst) {
			var self = inst || this;
			return {
				sections: self.sections
			};
		}

	});

})(jQuery);