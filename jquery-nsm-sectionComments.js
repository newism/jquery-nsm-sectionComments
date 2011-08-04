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
			//console.log('_init NSM.sectionComments');
			
			// Build the sections
			this._refresh();
			
			// calculate the comment count for each element
			//this.calculateSectionCommentCount();
			
			// When reply buttons are clicked, it will update the
			this._initCommentReplyElements(this.originalComments);
			
			// setup events
			//this._setupEvents();
			
			// Get global comment count
			this.globalComments = this._getGlobalCommentCount();
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
					return this.toggleSectionComments(sectionId);
				},this));
				
				// Add the reply buttons
				this._initCommentReplyElements(comments);

				//$section.data("commentTotal", $commentTotal);
					
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
	
		// 
		// // Calculate the comments for the section
		// calculateSectionCommentCount: function(){
		// 	//console.log('_calculateCommentCount NSM.sectionComments');
		// 
		// 	// Loop over the comments and calculate the totals
		// 	var sectionCommentTotals = {},
		// 		$comments = $(".comment", this.originalComments);
		// 	
		// 	for (var i = $comments.length - 1; i >= 0; i--){
		// 		var comment = $comments[i],
		// 			sectionId = comment.getAttribute('data-sectionId');
		// 		
		// 		if(sectionId) {
		// 			sectionCommentTotals[sectionId] = sectionCommentTotals[sectionId] + 1 || 1;
		// 		}
		// 	};
		// 	
		// 	for (var sectionId in this.sections) {
		// 		var section = this.sections[sectionId],
		// 			sectionCommentTotal = sectionCommentTotals[sectionId] || 0;
		// 	
		// 		section.comments = sectionCommentTotal;
		// 		section.totalComments.text(sectionCommentTotal + " comments");
		// 	}
		// 	
		// 	this.globalComments = sectionCommentTotals[0] || 0;
		// },
		
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
			//console.log('_loadSectionComments NSM.sectionComments');

			// var classes 	= this.options.classes,
			// 				selectors 	= this.options.selectors,
			// 				section		= this.sections[sectionId],
			// 				$section 	= section.element;
			
			var section		= this.sections[sectionId],
				$section 	= section.element;

			// Test to see if there are any existing comments
			// if so remove them so we can refresh the list / form if needed
			var $sectionComments = this.sections[sectionId].comments;
			
			// Remove them from the page
			// $sectionComments.remove();

			// $sectionComments = this.originalComments
			// 						.clone(true) // clone it
			// 						.data("clone", true); // let everyone know this is a clone
			
			// find the form and set the input values
			// var $sectionCommentForm = $(selectors.commentForm, $sectionComments)
			// 										.find(selectors.sectionIdInput).val(sectionId).end()
			// 										.find(selectors.parentCommentIdInput).val(0).end();
			
			// Update the comment form
			this._setFormData(sectionId,0);
			this._setReplySection(sectionId);

			//this._initCommentReplyElements($sectionComments);
			
			// remove comments that don't apply to this section
			//$sectionComments.find(selectors.comment+"[data-sectionId!="+sectionId+"]").remove();
		
			// update the comment reply trigger with the new section
			// $sectionComments.find(this.options.classes).data({
			// 				'sectionId': parseInt(sectionId)
			// 			});
						
			// append the new comments to the section
			this.sections[sectionId].comments.appendTo(section.element);

			//this.sections[sectionId].element.data('comments', $sectionComments);
			//this.sections[sectionId].comments = $sectionComments;
			
			// Fire an event
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
			//console.log('_createCommentReplyElements NSM.sectionComments');

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
					$trigger.bind('click', $.proxy(this._commentOnComment,this));
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
			//console.log('_commentOnComment NSM.sectionComments');
			event.preventDefault();

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

		// _setupEvents: function(){
		// 	var self = this;
		// 	$(".comment-total", this.element).each(function(index) {
		// 		var $trigger = $(this),
		// 			sectionId = $trigger.data('sectionid');
		// 		
		// 		$trigger.bind('click', function(){
		// 			return self.toggleSectionComments(sectionId);
		// 		});
		// 	});
		// 
		// 	$(".comment-reply-trigger", this.element)
		// 		.bind('click', $.proxy( this, "_commentOnComment" ));
		// },

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