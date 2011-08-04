(function($, undefined) {

	$.widget('NSM.sectionComments', {

		// all these "global" variables can be called like: this.blah
		// also this.element is the widget instance
		options: {
			animate: false,
			selectors: {
				section: '.entry-content-section',
				comments: '.comments',
				comment: '.comment',
				commentForm: '.comment-form',
				commentTotal: '.comment-total',
				parentCommentIdInput: 'input[name=parent_id]',
				sectionIdInput: 'input[name=row_id]',
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
			// Cache the original comments so we don't get duplicates
			this.originalComments = $(this.options.selectors.comments, this.element);
		},

		// called everytime ‘.comments()’ is executed on an element.
		_init: function () {
			
			// Build the sections
			this._refresh();
			
			// When reply buttons are clicked, it will update the
			this._initCommentReplyElements(this.originalComments);
			
			// Get global comment count
			this.globalComments = this._getGlobalCommentCount();
			
			console.log(this.sections);
		},
		
		// Refresh the section data
		_refresh: function(){
			
			// Grab the sections
			var $sections = $(this.options.selectors.section, this.element),
				$section,
				sectionId,
				$commentTotal,
				comments,
				totalComments;

			for (var i = $sections.length - 1; i >= 0; i--) {
				
				$section 		= $sections.eq(i);
				sectionId 		= $section.data('sectionid');
				
				// No section ID
				if(!sectionId) continue;
				
				// Comments
				comments 		= this._getSectionComments(sectionId);
				totalComments	= comments.find(this.options.selectors.comment).length;
				
				// Comment total text
				$commentTotal = $(this.options.selectors.commentTotal, $section);
				
				// Build the comment total elements if they dont exist
				if(!$commentTotal.length) {
					$commentTotal = $('<span />').addClass(this.options.classes.commentTotal).appendTo($section);
				}
				
				// Update the text
				$commentTotal.text(totalComments + " comments");
				
				// Setup the event for when you click the 'open' trigger for this section
				// For now, we're using the comment count
				$commentTotal.bind('click', $.proxy(function(){
					this.toggleSectionComments(sectionId);
					return false;
				},this));
				
				// Add the reply buttons
				this._initCommentReplyElements(comments);
				
				// Save the section
				this.sections[sectionId] = {
					
					// DOM element for this section
					element: $section,
					
					// DOM element for the total comment count
					commentTotalElement: $commentTotal,
										
					// Total comments for this section
					commentTotal: totalComments,
					
					// List of comments for this section
					comments: comments
				};
			}
		},
		
		// Returns the comment count for comments without a section
		_getGlobalCommentCount: function(){
			return $(this.options.selectors.comment+"[data-sectionid=0]", this.originalComments).length;
		},
		
		// Return a list of DOM elements that are the comments for a section
		_getSectionComments: function(sectionId) {
			var commentList = this.originalComments.clone(true);
			commentList.find(this.options.selectors.comment+"[data-sectionId!="+sectionId+"]").remove();
			return commentList;
		},
		
		// Update the hidden field in a form
		_setFormData: function(sectionId, parentId){
			
			var selectors 		= this.options.selectors,
				form 			= $(selectors.commentForm, this.sections[sectionId].comments),
				sectionField 	= form.find(selectors.sectionIdInput),
				parentField 	= form.find(selectors.parentCommentIdInput);
				
			sectionField.val(sectionId);
			
			if(parentId !== undefined) {
				parentField.val(parentId);
			}
		},
		
		// Set the section ID for the reply links
		_setReplySection: function(sectionId){
			this.sections[sectionId].comments.find(this.options.classes).data({
				'sectionId': parseInt(sectionId,10)
			});
		},

		// Load the comments for the section
		loadSectionComments: function(sectionId) {
			
			var section		= this.sections[sectionId],
				$section 	= section.element,
				comments 	= this.sections[sectionId].comments;
			
			// Update the form and reply links
			this._setFormData(sectionId,0);
			this._setReplySection(sectionId);
						
			// append the new comments to the section
			$section.append(comments);

			// Fire an event
			this._trigger('loadsectioncomments', {}, 
				$.extend(this._uiHash(), {
					comments: comments,
					sectionId: sectionId
				})
			);
		},

		// Toggle the section comments
		// Load them if we have to first
		toggleSectionComments: function(sectionId) {
			
			var comments = this.sections[sectionId].comments,
				openClass;
			
			if(comments.hasClass(openClass) === false) {
				this.loadSectionComments(sectionId);
				comments.addClass(openClass);
			}
			else {
				comments.remove().removeClass(openClass);
			}
		},
		
		// Creates a new reply button for a comment
		commentReplyTrigger: function(sectionId){
			var classes = this.options.classes,
				$trigger = $('<a />')
					.attr({ href: "#", 'data-section-id': sectionId })
					.addClass(classes.commentReplyTrigger)
					.text("Reply");
			return $trigger;
		},

		// For each comment create a reply link scoped to a group of comments
		_initCommentReplyElements: function(comments){
			//console.log('_createCommentReplyElements NSM.sectionComments');

			var self = this,
				options = this.options,
				classes = this.options.classes,
				selectors = this.options.selectors,
				$commentEls = $(this.options.selectors.comment, comments);
				
			for (var i = $commentEls.length - 1; i >= 0; i--){

				var $comment 	= $commentEls.eq(i),
					commentId 	= $comment.data('commentId') || 0,
					sectionId 	= $comment.data('sectionId') || 0,
					$trigger 	= $(selectors.commentReplyTrigger, $comment);
				
				// It doesn't exist
				if(!$trigger.length) {
					$trigger = this.commentReplyTrigger(sectionId);
					$comment.prepend($trigger);
					$trigger.bind('click', $.proxy(this._commentOnComment,this));
				}

				// $trigger.data({
				// 					'commentId': commentId,
				// 					'comments': $comments,
				// 					'comment' : $comment,
				// 					'sectionId': sectionId
				// 				});
			};
		},

		// Comment on a comment
		_commentOnComment: function(event) {
	
			var $eventTarget = $(event.target),
				$comment = $eventTarget.data("comment"),
				commentId = $comment.data("commentid") || 0,
				sectionId = $comment.data("sectionid") || 0,
				$comments = $eventTarget.data("comments");
						
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
			//console.log('_destroy NSM.sectionComments');

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